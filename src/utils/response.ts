import type { Response } from 'express';

export class AppError extends Error {
  constructor(message: string, public statusCode = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export const sendSuccess = (res: Response, data: unknown, statusCode = 200, meta?: object) => {
  res.status(statusCode).json({ success: true, data, ...(meta ? { meta } : {}) });
};

export const sendPaginated = (res: Response, data: unknown[], page: number, total: number, limit: number) => {
  res.status(200).json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  });
};
