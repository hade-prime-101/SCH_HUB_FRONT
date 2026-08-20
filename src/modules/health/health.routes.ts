import { Router } from 'express';
import { prisma } from '@/config/prisma.js';
import { sendSuccess } from '@/utils/response.js';
import { env } from '@/config/env.js';
import Bull from 'bull';

export const healthRoutes = Router();

const startTime = Date.now();

// Reuse a lightweight queue reference just for the ping — no jobs processed here
const pingQueue = new Bull('health-ping', { redis: env.REDIS_URL ?? 'redis://localhost:6379' });

healthRoutes.get('/', async (_req, res, next) => {
  try {
    // DB check
    let dbStatus: 'ok' | 'error' = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }

    // Redis check via Bull client
    let redisStatus: 'ok' | 'error' = 'ok';
    try {
      const client = await pingQueue.client;
      await client.ping();
    } catch {
      redisStatus = 'error';
    }

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const status = dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded';

    const payload = {
      status,
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };

    if (status === 'degraded') {
      res.status(503).json({ success: false, message: 'Service degraded', data: payload });
      return;
    }

    sendSuccess(res, payload);
  } catch (error) {
    next(error);
  }
});
