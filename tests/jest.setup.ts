import { prisma } from '@/config/prisma';
import { logger } from '@/utils/logger';

// ✅ Silence logger during tests
jest.spyOn(logger, 'info').mockImplementation(() => logger);
jest.spyOn(logger, 'warn').mockImplementation(() => logger);
jest.spyOn(logger, 'error').mockImplementation(() => logger);
jest.spyOn(logger, 'debug').mockImplementation(() => logger);

// ✅ Clear all mocks between tests
beforeEach(() => jest.clearAllMocks());

// ✅ Disconnect Prisma after all tests
afterAll(async () => {
  await prisma.$disconnect();
});