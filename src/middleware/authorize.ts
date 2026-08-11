import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { AppError } from '@/utils/response.js';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    return next();
  };
};
