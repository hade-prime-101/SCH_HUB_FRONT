import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    matricNumber: z.string().min(3, 'Invalid matric number'),
    level: z.enum(['100', '200', '300', '400', '500', '600'], { errorMap: () => ({ message: 'Invalid academic level' }) }),
    schoolId: z.string().min(1, 'Please select a school'),
    facultyId: z.string().min(1, 'Please select a faculty'),
    departmentId: z.string().min(1, 'Please select a department'),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6).regex(/^\d{6}$/),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
