import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRole;
      schoolId: string;
      departmentId: string;
      level: string;
    }

    interface Request {
      user?: User;
      id?: string;
    }
  }
}

export {};
