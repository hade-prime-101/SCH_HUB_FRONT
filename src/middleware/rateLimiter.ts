import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env.js';

function rateLimitHandler(req: Request, res: Response) {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
    requestId: req.id,
  });
}

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.NODE_ENV === 'production' ? 100 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 5 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
