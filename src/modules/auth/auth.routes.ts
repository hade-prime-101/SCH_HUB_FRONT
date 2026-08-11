import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authRateLimiter } from '@/middleware/rateLimiter.js';
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendOtp,
  resetPassword,
  verifyOtp,
} from '@/modules/auth/auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter, register);
authRoutes.post('/login', authRateLimiter, login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', authenticate, logout);
authRoutes.get('/me', authenticate, me);
authRoutes.post('/forgot-password', authRateLimiter, forgotPassword);
authRoutes.post('/verify-otp', authRateLimiter, verifyOtp);
authRoutes.post('/reset-password', authRateLimiter, resetPassword);
authRoutes.post('/resend-otp', authRateLimiter, resendOtp);
