import crypto from 'node:crypto';
import { prisma } from '@/config/prisma.js';
import { r2 } from '@/config/r2.js';
import { AppError } from '@/utils/response.js';
import { groqChat } from '@/config/groq.js';
import { extractTextOrReject } from '@/utils/extractText.js';
import type { PersonalQuizQuestion } from '@prisma/client';
import {
  PERSONAL_QUIZ_SYSTEM,
  personalQuizPrompt,
  PERSONAL_ASK_SYSTEM,
  personalAskPrompt,
} from '@/modules/ai/prompts/personal-study.prompt.js';
import type { z } from 'zod';
import type {
  createSessionSchema,
  generatePersonalQuizSchema,
  askPersonalSchema,
} from '@/modules/ai/personal-study.validators.js';

type CreateSessionInput        = z.infer<typeof createSessionSchema>;
type GeneratePersonalQuizInput = z.infer<typeof generatePersonalQuizSchema>;
type AskPersonalInput          = z.infer<typeof askPersonalSchema>;

// ── Rate limit constants ──────────────────────────────────────────────────
// These cap how many Groq calls a single user can make per day across all
// personal-study sessions, preventing runaway costs.
const DAILY_ASK_LIMIT         = 20;  // chat Q&A calls per user per day
const DAILY_QUIZ_GEN_LIMIT    = 5;   // quiz generation calls per user per day
// Hard cap on questions that can exist per session at once (limits token size)
const MAX_QUESTIONS_PER_SESSION = 30;
// Max chars of material sent to Groq per call (keeps tokens predictable)
const MAX_MATERIAL_CHARS      = 4_000;
// Max chat turns sent as history context per ask call
const CHAT_HISTORY_LIMIT      = 6;

// ── Helpers ───────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function checkDailyAskLimit(userId: string) {
  const count = await prisma.personalStudyChat.count({
    where: {
      role: 'USER',
      session: { userId },
      createdAt: { gte: startOfToday() },
    },
  });
  if (count >= DAILY_ASK_LIMIT) {
    throw new AppError(
      `Daily AI question limit reached (${DAILY_ASK_LIMIT}/day). Try again tomorrow.`,
      429,
    );
  }
}

async function checkDailyQuizGenLimit(userId: string) {
  // Count how many times quiz/generate was called today by checking questions
  // created today across all sessions owned by this user.
  // We track this via a lightweight approach: count distinct sessions that had
  // questions created today.
  const today = startOfToday();
  const count = await prisma.personalQuizQuestion.count({
    where: {
      session: { userId },
      createdAt: { gte: today },
    },
  });
  // Each generation creates at least 3 questions, so we use question count as a
  // proxy — but cap on generation calls is cleaner. We store a sentinel by
  // counting questions with order === 0 (first question of each generation batch).
  const generationCount = await prisma.personalQuizQuestion.count({
    where: {
      order: 0,
      session: { userId },
      createdAt: { gte: today },
    },
  });
  if (generationCount >= DAILY_QUIZ_GEN_LIMIT) {
    throw new AppError(
      `Daily quiz generation limit reached (${DAILY_QUIZ_GEN_LIMIT}/day). Try again tomorrow.`,
      429,
    );
  }
  return { generationCount };
}

async function resolveExtractedText(session: {
  materialId: string | null;
  extractedText: string | null;
}): Promise<string> {
  if (session.extractedText) return session.extractedText;

  if (session.materialId) {
    const mat = await prisma.material.findUnique({
      where: { id: session.materialId },
      select: { extractedText: true, textExtractionStatus: true },
    });
    if (!mat || !mat.extractedText || mat.textExtractionStatus !== 'READABLE') {
      throw new AppError('The linked material has no readable text for AI processing.', 400);
    }
    return mat.extractedText;
  }

  throw new AppError('No text content found for this session.', 400);
}

// ── Service ───────────────────────────────────────────────────────────────

export const personalStudyService = {
  // ── Sessions ──────────────────────────────────────────────────────────

  async listSessions(userId: string) {
    return prisma.personalStudySession.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        courseCode: true,
        materialId: true,
        privateFileName: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { questions: true, chatHistory: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getSession(sessionId: string, userId: string) {
    const session = await prisma.personalStudySession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        chatHistory: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
        material: {
          select: {
            id: true, title: true, courseCode: true, mimeType: true,
            extractedTextPreview: true, textExtractionStatus: true,
          },
        },
      },
    });

    if (!session) throw new AppError('Session not found', 404);
    if (session.userId !== userId) throw new AppError('Session not found', 404);

    // Strip raw extracted text — never send full text to client
    const { extractedText: _, ...rest } = session;
    return rest;
  },

  async createSession(
    input: CreateSessionInput,
    userId: string,
    file?: Express.Multer.File,
  ) {
    if (!input.materialId && !file) {
      throw new AppError('Provide either a materialId or upload a file.', 400);
    }
    if (input.materialId && file) {
      throw new AppError('Provide either a materialId or a file, not both.', 400);
    }

    let materialId: string | undefined;
    let privateFileUrl: string | undefined;
    let privateFileKey: string | undefined;
    let privateFileSize: number | undefined;
    let privateMimeType: string | undefined;
    let privateFileName: string | undefined;
    let extractedText: string | undefined;

    if (input.materialId) {
      const mat = await prisma.material.findUnique({
        where: { id: input.materialId, isDeleted: false },
        select: { id: true, extractedText: true, textExtractionStatus: true, reviewStatus: true },
      });
      if (!mat) throw new AppError('Material not found', 404);
      if (mat.reviewStatus === 'PENDING_REVIEW') {
        throw new AppError('This material is still under review and cannot be used yet.', 403);
      }
      if (mat.textExtractionStatus !== 'READABLE' || !mat.extractedText) {
        throw new AppError('Selected material has no readable text for AI processing.', 400);
      }
      materialId = mat.id;
    } else if (file) {
      // ── Text extraction ────────────────────────────────────────────────
      // extractTextOrReject runs the full pipeline: text-layer extraction
      // first, then Groq Vision → Gemini Vision OCR fallback for scanned PDFs.
      // Throws 422 only if all methods are exhausted and text is still unreadable.
      let extraction;
      try {
        extraction = await extractTextOrReject(file.buffer, file.mimetype, file.originalname);
      } catch (err) {
        // Re-throw AppError (422 unreadable) as-is; wrap unexpected extractor crashes
        if (err instanceof AppError) throw err;
        throw new AppError(
          'Failed to read file content. Ensure the file is not corrupted or password-protected.',
          422,
        );
      }

      // ── Storage upload ─────────────────────────────────────────────────
      let uploadResult: { key: string; url: string };
      try {
        uploadResult = await r2.upload(
          file.buffer,
          `personal-${userId}-${crypto.randomUUID()}-${file.originalname}`,
          file.mimetype,
        );
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new AppError(`File storage upload failed: ${detail}`, 502);
      }

      privateFileUrl  = uploadResult.url;
      privateFileKey  = uploadResult.key;
      privateFileSize = file.size;
      privateMimeType = file.mimetype;
      privateFileName = file.originalname;
      extractedText   = extraction.text ?? undefined;
    }

    const session = await prisma.personalStudySession.create({
      data: {
        userId,
        title: input.title,
        courseCode: input.courseCode,
        materialId: materialId ?? null,
        privateFileUrl: privateFileUrl ?? null,
        privateFileKey: privateFileKey ?? null,
        privateFileSize: privateFileSize ?? null,
        privateMimeType: privateMimeType ?? null,
        privateFileName: privateFileName ?? null,
        extractedText: extractedText ?? null,
      },
      select: {
        id: true, title: true, courseCode: true, materialId: true,
        privateFileName: true, createdAt: true,
      },
    });

    return session;
  },

  async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.personalStudySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new AppError('Session not found', 404);

    if (session.privateFileKey) {
      await r2.delete(session.privateFileKey).catch(() => null);
    }

    await prisma.personalStudySession.delete({ where: { id: sessionId } });
    return { deleted: true };
  },

  // ── AI: Generate personalised quiz ───────────────────────────────────

  async generatePersonalQuiz(
    sessionId: string,
    userId: string,
    input: GeneratePersonalQuizInput,
  ) {
    // ── Rate limit check ────────────────────────────────────────────────
    await checkDailyQuizGenLimit(userId);

    const session = await prisma.personalStudySession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true, materialId: true, extractedText: true, courseCode: true,
        _count: { select: { questions: true } },
      },
    });

    if (!session || session.userId !== userId) throw new AppError('Session not found', 404);

    // ── Per-session question cap ─────────────────────────────────────────
    // Prevent accumulating hundreds of questions in one session
    if (!input.replaceExisting && session._count.questions >= MAX_QUESTIONS_PER_SESSION) {
      throw new AppError(
        `This session already has ${session._count.questions} questions (max ${MAX_QUESTIONS_PER_SESSION}). ` +
        `Set replaceExisting: true to regenerate.`,
        400,
      );
    }

    const fullText = await resolveExtractedText(session);
    // Truncate material to keep token usage predictable
    const text = fullText.slice(0, MAX_MATERIAL_CHARS);

    const raw = await groqChat(
      PERSONAL_QUIZ_SYSTEM,
      personalQuizPrompt(text, input.questionCount, input.focusTopics),
    );

    type RawQ = { question: string; options: string[]; correctAnswer: number; explanation?: string; topic?: string };
    let questions: RawQ[] = [];
    try {
      const parsed = JSON.parse(raw);
      questions = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    } catch {
      throw new AppError('AI returned an unexpected response. Please try again.', 500);
    }

    if (questions.length === 0) throw new AppError('AI could not generate questions from this material.', 400);

    if (input.replaceExisting) {
      await prisma.personalQuizQuestion.deleteMany({ where: { sessionId } });
    }

    const created = await prisma.personalQuizQuestion.createMany({
      data: questions.map((q, idx) => ({
        sessionId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? null,
        topic: q.topic ?? session.courseCode,
        order: idx,
      })),
    });

    await prisma.personalStudySession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

    const all = await prisma.personalQuizQuestion.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });

    return {
      generated: created.count,
      questions: all,
      usage: {
        quizGenerationsToday: (await checkDailyQuizGenLimit(userId).catch(() => null), undefined),
        dailyLimit: DAILY_QUIZ_GEN_LIMIT,
      },
    };
  },

  // ── AI: Ask a question about the material ────────────────────────────

  async askQuestion(sessionId: string, userId: string, input: AskPersonalInput) {
    // ── Rate limit check ────────────────────────────────────────────────
    await checkDailyAskLimit(userId);

    const session = await prisma.personalStudySession.findUnique({
      where: { id: sessionId },
      select: {
        userId: true,
        materialId: true,
        extractedText: true,
        chatHistory: {
          orderBy: { createdAt: 'desc' },
          // Fetch last N turns only to bound context size
          take: CHAT_HISTORY_LIMIT * 2,
          select: { role: true, content: true },
        },
      },
    });

    if (!session || session.userId !== userId) throw new AppError('Session not found', 404);

    const fullText = await resolveExtractedText(session);
    // Truncate material context sent to Groq
    const text = fullText.slice(0, MAX_MATERIAL_CHARS);

    // History comes back newest-first from the DESC query; reverse for prompt
    const historyForPrompt = [...(session.chatHistory as Array<{ role: string; content: string }>)].reverse();

    const raw = await groqChat(
      PERSONAL_ASK_SYSTEM,
      personalAskPrompt(input.question, text, historyForPrompt),
    );

    let parsed: { answer: string; foundInMaterial: boolean; followUpSuggestions?: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { answer: raw, foundInMaterial: false, followUpSuggestions: [] };
    }

    await prisma.$transaction([
      prisma.personalStudyChat.create({
        data: { sessionId, role: 'USER', content: input.question },
      }),
      prisma.personalStudyChat.create({
        data: { sessionId, role: 'ASSISTANT', content: parsed.answer },
      }),
    ]);

    await prisma.personalStudySession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

    // Count remaining asks today so the client can show a usage indicator
    const usedToday = await prisma.personalStudyChat.count({
      where: {
        role: 'USER',
        session: { userId },
        createdAt: { gte: startOfToday() },
      },
    });

    return {
      question: input.question,
      answer: parsed.answer,
      foundInMaterial: parsed.foundInMaterial ?? true,
      followUpSuggestions: parsed.followUpSuggestions ?? [],
      usage: { asksToday: usedToday, dailyLimit: DAILY_ASK_LIMIT },
    };
  },

  // ── Quiz: submit answers and get score ───────────────────────────────

  async submitQuizAnswers(
    sessionId: string,
    userId: string,
    answers: Array<{ questionId: string; selected: number }>,
  ) {
    const session = await prisma.personalStudySession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new AppError('Session not found', 404);

    const questions = await prisma.personalQuizQuestion.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });

    const qMap = new Map<string, PersonalQuizQuestion>(questions.map((q: PersonalQuizQuestion) => [q.id, q]));
    let correct = 0;
    const graded = answers.map((a) => {
      const q = qMap.get(a.questionId);
      const isCorrect = q ? q.correctAnswer === a.selected : false;
      if (isCorrect) correct++;
      return {
        questionId: a.questionId,
        selected: a.selected,
        correct: isCorrect,
        correctAnswer: q?.correctAnswer ?? -1,
        explanation: q?.explanation ?? null,
      };
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { score: correct, total, percentage, answers: graded };
  },
};

