import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.js';
import { AppError } from '@/utils/response.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), env.JWT_ACCESS_SECRET) as Express.User;
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }

    return next(new AppError('Invalid token', 401));
  }
};
