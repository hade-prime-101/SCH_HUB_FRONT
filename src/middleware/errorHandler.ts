import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { Sentry } from '@/config/sentry.js';
import { logger } from '@/utils/logger.js';
import { AppError } from '@/utils/response.js';

const sanitize = (v: string) => v.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ');

export const notFoundHandler: RequestHandler = () => {
  throw new AppError('Route not found', 404);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode: number;
  let message: string;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = sanitize(err.message);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = sanitize(err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Conflict: duplicate resource';
    } else if (err.code === 'P2003') {
      statusCode = 409;
      message = 'Conflict: related resource not found';
    } else {
      statusCode = 400;
      message = 'Database request error';
    }
  } else if (
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    statusCode = 400;
    message = 'Database error';
  } else {
    statusCode = 500;
    message = 'Internal server error';
  }

  const meta: Record<string, unknown> = {
    method: sanitize(req.method),
    url: sanitize(req.originalUrl),
    statusCode,
    userId: req.user?.id,
    requestId: req.id,
  };

  if (statusCode >= 500) {
    const errMsg = err instanceof Error ? sanitize(err.message) : sanitize(String(err));
    logger.error(message, { ...meta, error: errMsg });
    Sentry.withScope((scope) => {
      if (req.id) scope.setTag('request_id', req.id);
      if (req.user?.id) scope.setUser({ id: req.user.id, email: req.user.email });
      scope.setContext('request', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
      });
      Sentry.captureException(err);
    });
  } else if (statusCode >= 400) {
    logger.warn(message, meta);
  }

  res.status(statusCode).json({
    success: false,
    message,
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && err instanceof Error ? { stack: err.stack } : {}),
  });
};
