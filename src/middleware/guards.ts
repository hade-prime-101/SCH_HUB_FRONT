import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/response.js';

// Blocks anyone who is not SCHOOL_ADMIN or SUPER_ADMIN
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return next(new AppError('Admin access required', 403));
  }
  return next();
};

// Blocks anyone who is not SUPER_ADMIN
export const requireSuperAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Super admin access required', 403));
  }
  return next();
};

// Ensures SCHOOL_ADMIN can only operate on their own school.
// Reads schoolId from req.params.schoolId or req.body.schoolId.
// SUPER_ADMIN bypasses this check.
export const scopeToSchool = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (req.user.role === 'SUPER_ADMIN') return next();

  const targetSchoolId = req.params.schoolId ?? req.body.schoolId ?? req.query.schoolId;

  if (targetSchoolId && targetSchoolId !== req.user.schoolId) {
    return next(new AppError('You can only manage your own school', 403));
  }

  return next();
};
