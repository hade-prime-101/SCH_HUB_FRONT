import { prisma } from '@/config/prisma.js';
import { groqChat } from '@/config/groq.js';
import { env } from '@/config/env.js';
import { firebase } from '@/config/firebase.js';
import { aiSummaryQueue, AI_SUMMARY_JOB } from '@/jobs/queues.js';
import { SUMMARY_SYSTEM, summaryPrompt } from '@/modules/ai/prompts/summary.prompt.js';
import { QUIZ_SYSTEM, quizPrompt } from '@/modules/ai/prompts/quiz.prompt.js';
import { EXAM_SYSTEM, examPrompt } from '@/modules/ai/prompts/exam.prompt.js';
import { BEGINNER_SYSTEM, beginnerPrompt } from '@/modules/ai/prompts/beginner.prompt.js';
import { AGGREGATION_SYSTEM, aggregationPrompt } from '@/modules/ai/prompts/aggregation.prompt.js';
import { ROADMAP_SYSTEM, roadmapPrompt } from '@/modules/ai/prompts/roadmap.prompt.js';
import { extractText } from '@/utils/extractText.js';
import fs from 'node:fs/promises';
import path from 'node:path';

// Must match MIN_READABLE_CHARS in extractText.ts — text shorter than this
// triggers a re-fetch + re-extraction attempt (or OCR for scanned PDFs).
const MIN_READABLE = 200;

const PRIVATE_HOST_RE =
  /^(localhost|.*\.local)$|^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1|fc00:|fe80:)/i;

function assertSafeFileUrl(raw: string): void {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error(`Invalid file URL: ${raw}`); }
  if (parsed.protocol !== 'https:') throw new Error('File URL must use https');
  if (PRIVATE_HOST_RE.test(parsed.hostname)) throw new Error('File URL targets a private host');
  if (env.SUPABASE_PUBLIC_URL) {
    const allowed = new URL(env.SUPABASE_PUBLIC_URL);
    if (parsed.origin !== allowed.origin) throw new Error('File URL origin not allowed');
  }
}

const CHUNK_SIZE = 2000;

const chunkText = (text: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

const safeParse = <T>(json: string, fallback: T): T => {
  try { return JSON.parse(json) as T; } catch { return fallback; }
};

export const processAISummaryJob = async (materialId: string, aiSummaryId: string) => {
  const startTime = Date.now();

  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { uploadedBy: true, department: true },
    });
    if (!material) throw new Error('Material not found');

    // ── Text acquisition ───────────────────────────────────────────────────
    // Priority 1: pre-extracted text stored at upload time
    // Priority 2: re-fetch and extract from URL (fallback for legacy records)
    // Priority 3: metadata stub

    let pdfText = material.extractedText ?? '';

    if (pdfText.length < MIN_READABLE) {
      try {
        let buffer: Buffer;
        if (material.fileUrl.startsWith('/uploads')) {
          const localPath = path.resolve('uploads', path.basename(material.fileUrl.replace(/^\/uploads\//, '')));
          buffer = await fs.readFile(localPath);
        } else {
          assertSafeFileUrl(material.fileUrl);
          const response = await fetch(material.fileUrl);
          buffer = Buffer.from(await response.arrayBuffer());
        }
        const result = await extractText(buffer, material.mimeType, material.title);
        pdfText = result.text;
      } catch {
        pdfText = '';
      }
    }

    if (pdfText.length < MIN_READABLE) {
      pdfText = `${material.title}. Course: ${material.courseCode}. ${material.description ?? ''}`;
    }

    const chunks = chunkText(pdfText);
    const totalChunks = chunks.length;

    await prisma.aISummary.update({
      where: { id: aiSummaryId },
      data: { status: 'PROCESSING', totalChunks, progress: 0 },
    });

    type QuizQ = { question: string; options: string[]; correctAnswer: number; explanation: string };
    const chunkResults: Array<{
      summary: string;
      keyPoints: string[];
      examTopics: string[];
      quizQuestions: QuizQ[];
      beginnerExplanation: string;
    }> = [];

    // ── Per-chunk processing ───────────────────────────────────────────────
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const [summaryRaw, quizRaw, examRaw, beginnerRaw] = await Promise.all([
        groqChat(SUMMARY_SYSTEM, summaryPrompt(chunk, i + 1, totalChunks)),
        groqChat(QUIZ_SYSTEM, quizPrompt(chunk, 3)),
        groqChat(EXAM_SYSTEM, examPrompt(chunk)),
        groqChat(BEGINNER_SYSTEM, beginnerPrompt(chunk)),
      ]);

      const summaryData = safeParse(summaryRaw, { summary: '', keyPoints: [], examTopics: [], beginnerExplanation: '' });
      const quizData = safeParse<QuizQ[]>(quizRaw, []);
      const examData = safeParse(examRaw, { likelyExamTopics: [] });
      const beginnerData = safeParse(beginnerRaw, { simpleExplanation: '' });

      const chunkResult = {
        summary: summaryData.summary ?? '',
        keyPoints: summaryData.keyPoints ?? [],
        examTopics: examData.likelyExamTopics ?? summaryData.examTopics ?? [],
        quizQuestions: Array.isArray(quizData) ? quizData : [],
        beginnerExplanation: beginnerData.simpleExplanation ?? summaryData.beginnerExplanation ?? '',
      };

      chunkResults.push(chunkResult);

      await prisma.aISummaryChunk.upsert({
        where: { aiSummaryId_chunkNumber: { aiSummaryId, chunkNumber: i } },
        create: {
          aiSummaryId, chunkNumber: i,
          summary: chunkResult.summary,
          keyPoints: chunkResult.keyPoints,
          examTopics: chunkResult.examTopics,
          quizQuestions: chunkResult.quizQuestions,
          beginnerExplanation: chunkResult.beginnerExplanation,
          status: 'COMPLETED',
        },
        update: {
          summary: chunkResult.summary,
          keyPoints: chunkResult.keyPoints,
          examTopics: chunkResult.examTopics,
          quizQuestions: chunkResult.quizQuestions,
          beginnerExplanation: chunkResult.beginnerExplanation,
          status: 'COMPLETED',
        },
      });

      await prisma.aISummary.update({
        where: { id: aiSummaryId },
        data: { processedChunks: i + 1, progress: Math.round(((i + 1) / totalChunks) * 80) },
      });
    }

    // ── Aggregation ────────────────────────────────────────────────────────
    const allSummaries = chunkResults.map((c) => c.summary).filter(Boolean);
    const combinedKeyPoints = chunkResults.flatMap((c) => c.keyPoints);
    const combinedExamTopics = chunkResults.flatMap((c) => c.examTopics);

    const [aggregationRaw, roadmapRaw] = await Promise.all([
      groqChat(AGGREGATION_SYSTEM, aggregationPrompt(allSummaries)),
      groqChat(ROADMAP_SYSTEM, roadmapPrompt(allSummaries.join(' '), combinedKeyPoints, combinedExamTopics)),
    ]);

    await prisma.aISummary.update({ where: { id: aiSummaryId }, data: { progress: 90 } });

    const aggregated = safeParse(aggregationRaw, {
      finalSummary: allSummaries.join(' '),
      combinedKeyPoints: [],
      combinedExamTopics: [],
      revisionSheet: '',
    });

    const roadmapData = safeParse(roadmapRaw, { roadmap: [], totalEstimatedMinutes: 0, studyTip: '' });

    // ── AI Quiz bank — starts as PENDING_REVIEW ────────────────────────────
    const allQuizQuestions = chunkResults.flatMap((c) => c.quizQuestions);
    let masterQuizId: string | null = null;

    if (allQuizQuestions.length > 0) {
      const quiz = await prisma.quiz.create({
        data: {
          title: `AI Quiz: ${material.title}`,
          courseCode: material.courseCode,
          description: `Auto-generated from "${material.title}". Pending review before students can attempt.`,
          level: material.level ?? undefined,
          timeLimit: allQuizQuestions.length * 60,
          departmentId: material.departmentId,
          createdById: material.uploadedById,
          creatorRole: 'SYSTEM',
          visibility: 'DEPARTMENT',
          isAiGenerated: true,
          isDraft: true,                         // hidden from students
          quizApprovalStatus: 'PENDING_REVIEW',  // course rep must approve
          questions: {
            create: allQuizQuestions.map((q, idx) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              order: idx,
            })),
          },
        },
      });
      masterQuizId = quiz.id;
    }

    // ── Final save ─────────────────────────────────────────────────────────
    await prisma.aISummary.update({
      where: { id: aiSummaryId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        processedChunks: totalChunks,
        shortSummary: aggregated.finalSummary,
        keyPoints: combinedKeyPoints.slice(0, 8),
        likelyExamTopics: aggregated.combinedExamTopics,
        simplifiedExplanation: chunkResults[0]?.beginnerExplanation ?? '',
        finalSummary: aggregated.finalSummary,
        combinedKeyPoints: aggregated.combinedKeyPoints,
        combinedExamTopics: aggregated.combinedExamTopics,
        revisionSheet: aggregated.revisionSheet,
        revisionRoadmap: roadmapData.roadmap?.length ? (roadmapData as object) : undefined,
        quizApprovalStatus: masterQuizId ? 'PENDING_REVIEW' : 'APPROVED',
        masterQuizId,
        processingTimeMs: Date.now() - startTime,
      },
    });

    // ── Notify uploader ────────────────────────────────────────────────────
    if (material.uploadedBy.fcmToken) {
      const quizNote = masterQuizId ? ' A quiz bank has been generated — review it before publishing.' : '';
      await firebase.sendPush(
        material.uploadedBy.fcmToken,
        '📚 AI Assets Ready!',
        `All study assets for "${material.title}" are ready.${quizNote}`,
        { type: 'AI_SUMMARY', materialId, ...(masterQuizId ? { quizId: masterQuizId } : {}) }
      );
    }

  } catch (error) {
    await prisma.aISummary.update({
      where: { id: aiSummaryId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
};

// Register job processor
aiSummaryQueue.process(AI_SUMMARY_JOB, async (job) => {
  const { materialId, aiSummaryId } = job.data;
  await processAISummaryJob(materialId, aiSummaryId);
});
