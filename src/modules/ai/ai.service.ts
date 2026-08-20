import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { aiSummaryQueue, AI_SUMMARY_JOB } from '@/jobs/queues.js';

const AI_DAILY_LIMIT = 5;

export const aiService = {
  async requestSummary(materialId: string, userId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId, isDeleted: false },
      select: { id: true, title: true, mimeType: true, contentHash: true, aiSummary: true },
    });

    if (!material) throw new AppError('Material not found', 404);

    // Check if completed summary already exists (cache by materialId)
    if (material.aiSummary?.status === 'COMPLETED') {
      return { cached: true, summary: material.aiSummary };
    }

    // Check if already processing
    if (material.aiSummary?.status === 'PROCESSING' || material.aiSummary?.status === 'PENDING') {
      return { cached: false, queued: true, summary: material.aiSummary };
    }

    // Daily rate limit per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestCount = await prisma.aISummaryRequest.count({
      where: { userId, createdAt: { gte: today } },
    });
    if (requestCount >= AI_DAILY_LIMIT) {
      throw new AppError(`Daily AI summary limit reached (${AI_DAILY_LIMIT}/day)`, 429);
    }

    // Create or reset summary record
    const aiSummary = await prisma.aISummary.upsert({
      where: { materialId },
      create: { materialId, status: 'PENDING', progress: 0 },
      update: { status: 'PENDING', progress: 0, errorMessage: null },
    });

    // Log request
    await prisma.aISummaryRequest.create({ data: { userId, materialId } });

    // Add to queue
    await aiSummaryQueue.add(AI_SUMMARY_JOB, { materialId, aiSummaryId: aiSummary.id }, { priority: 1 });

    return { cached: false, queued: true, summary: aiSummary };
  },

  async getSummary(materialId: string) {
    let summary = await prisma.aISummary.findUnique({
      where: { materialId },
      include: {
        chunks: {
          select: { chunkNumber: true, status: true },
          orderBy: { chunkNumber: 'asc' },
        },
      },
    });

    // If no summary exists, create a PENDING one so frontend can poll
    if (!summary) {
      summary = await prisma.aISummary.create({
        data: { materialId, status: 'PENDING', progress: 0 },
        include: {
          chunks: {
            select: { chunkNumber: true, status: true },
            orderBy: { chunkNumber: 'asc' },
          },
        },
      });
    }

    return {
      id: summary.id,
      materialId: summary.materialId,
      status: summary.status,
      progress: summary.progress,
      totalChunks: summary.totalChunks,
      processedChunks: summary.processedChunks,
      errorMessage: summary.errorMessage,
      // Tab data
      tabs: {
        summary: {
          shortSummary: summary.shortSummary,
          finalSummary: summary.finalSummary,
          revisionSheet: summary.revisionSheet,
        },
        keyPoints: {
          points: summary.combinedKeyPoints ?? summary.keyPoints ?? [],
        },
        examFocus: {
          topics: summary.combinedExamTopics ?? summary.likelyExamTopics ?? [],
        },
        beginner: {
          explanation: summary.simplifiedExplanation,
        },
        quiz: {
          quizId: summary.masterQuizId,
        },
      },
      chunks: summary.chunks,
      processingTimeMs: summary.processingTimeMs,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  },

  async getUserSummaries(userId: string) {
    const requests = await prisma.aISummaryRequest.findMany({
      where: { userId },
      distinct: ['materialId'],
      orderBy: { createdAt: 'desc' },
      include: {
        material: {
          select: {
            id: true, title: true, courseCode: true,
            aiSummary: { select: { status: true, progress: true, createdAt: true } },
          },
        },
      },
    });

    return requests.map((r: typeof requests[number]) => ({
      materialId: r.materialId,
      title: r.material.title,
      courseCode: r.material.courseCode,
      status: r.material.aiSummary?.status ?? 'NOT_STARTED',
      progress: r.material.aiSummary?.progress ?? 0,
      createdAt: r.createdAt,
    }));
  },
};
