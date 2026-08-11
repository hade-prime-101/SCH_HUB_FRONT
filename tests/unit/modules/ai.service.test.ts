import { prismaMock, mockUser } from '../../helpers/mock-factories';
import { aiService } from '@/modules/ai/ai.service';

const mockMaterial = (overrides: Record<string, unknown> = {}) => ({
  id: 'mat-1', title: 'Test PDF', mimeType: 'application/pdf',
  contentHash: 'abc', aiSummary: null, ...overrides,
});

describe('aiService.requestSummary', () => {
  it('throws 404 when material not found', async () => {
    prismaMock.material.findUnique.mockResolvedValue(null);
    await expect(aiService.requestSummary('mat-1', 'u-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 for non-PDF material', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial({ mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) as any);
    await expect(aiService.requestSummary('mat-1', 'u-1')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns cached summary when status is COMPLETED', async () => {
    const aiSummary = { status: 'COMPLETED', id: 's-1' };
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial({ aiSummary }) as any);
    const result = await aiService.requestSummary('mat-1', 'u-1');
    expect(result).toMatchObject({ cached: true, summary: aiSummary });
  });

  it('returns queued when status is PROCESSING', async () => {
    const aiSummary = { status: 'PROCESSING', id: 's-1' };
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial({ aiSummary }) as any);
    const result = await aiService.requestSummary('mat-1', 'u-1');
    expect(result).toMatchObject({ cached: false, queued: true });
  });

  it('returns queued when status is PENDING', async () => {
    const aiSummary = { status: 'PENDING', id: 's-1' };
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial({ aiSummary }) as any);
    const result = await aiService.requestSummary('mat-1', 'u-1');
    expect(result).toMatchObject({ cached: false, queued: true });
  });

  it('throws 429 when daily limit reached', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial() as any);
    prismaMock.aISummaryRequest.count.mockResolvedValue(5);
    await expect(aiService.requestSummary('mat-1', 'u-1')).rejects.toMatchObject({ statusCode: 429 });
  });

  it('creates summary and queues job when under limit', async () => {
    prismaMock.material.findUnique.mockResolvedValue(mockMaterial() as any);
    prismaMock.aISummaryRequest.count.mockResolvedValue(0);
    const summary = { id: 's-new', materialId: 'mat-1', status: 'PENDING', progress: 0 };
    prismaMock.aISummary.upsert.mockResolvedValue(summary as any);
    prismaMock.aISummaryRequest.create.mockResolvedValue({} as any);

    const result = await aiService.requestSummary('mat-1', 'u-1');
    expect(result).toMatchObject({ cached: false, queued: true });
    expect(prismaMock.aISummary.upsert).toHaveBeenCalled();
  });
});

describe('aiService.getSummary', () => {
  it('throws 404 when no summary exists', async () => {
    prismaMock.aISummary.findUnique.mockResolvedValue(null);
    await expect(aiService.getSummary('mat-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns shaped summary object', async () => {
    const summary = {
      id: 's-1', materialId: 'mat-1', status: 'COMPLETED', progress: 100,
      totalChunks: 2, processedChunks: 2, errorMessage: null,
      shortSummary: 'short', finalSummary: 'final', revisionSheet: 'rev',
      combinedKeyPoints: ['kp1'], keyPoints: [], combinedExamTopics: ['et1'],
      likelyExamTopics: [], simplifiedExplanation: 'simple', masterQuizId: 'q-1',
      processingTimeMs: 1000, createdAt: new Date(), updatedAt: new Date(),
      chunks: [{ chunkNumber: 1, status: 'COMPLETED' }],
    };
    prismaMock.aISummary.findUnique.mockResolvedValue(summary as any);
    const result = await aiService.getSummary('mat-1');
    expect(result.status).toBe('COMPLETED');
    expect(result.tabs.summary.shortSummary).toBe('short');
    expect(result.tabs.keyPoints.points).toEqual(['kp1']);
    expect(result.chunks).toHaveLength(1);
  });
});

describe('aiService.getUserSummaries', () => {
  it('returns mapped summaries list', async () => {
    const requests = [{
      materialId: 'mat-1',
      createdAt: new Date(),
      material: {
        id: 'mat-1', title: 'Doc', courseCode: 'CSC101',
        aiSummary: { status: 'COMPLETED', progress: 100, createdAt: new Date() },
      },
    }];
    prismaMock.aISummaryRequest.findMany.mockResolvedValue(requests as any);
    const result = await aiService.getUserSummaries('u-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ materialId: 'mat-1', status: 'COMPLETED' });
  });

  it('defaults status to NOT_STARTED when no aiSummary', async () => {
    const requests = [{
      materialId: 'mat-2', createdAt: new Date(),
      material: { id: 'mat-2', title: 'Doc2', courseCode: 'CSC102', aiSummary: null },
    }];
    prismaMock.aISummaryRequest.findMany.mockResolvedValue(requests as any);
    const result = await aiService.getUserSummaries('u-1');
    expect(result[0].status).toBe('NOT_STARTED');
    expect(result[0].progress).toBe(0);
  });
});
