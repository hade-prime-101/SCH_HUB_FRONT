import type { RequestHandler } from 'express';
import { authService } from '@/modules/auth/auth.service.js';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '@/modules/auth/auth.validators.js';
import { sendSuccess } from '@/utils/response.js';

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(registerSchema.parse(req.body));
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(loginSchema.parse(req.body));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(refreshSchema.parse(req.body));
    sendSuccess(res, tokens);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(String(req.body.refreshToken ?? ''));
    sendSuccess(res, { loggedOut: true });
  } catch (error) {
    next(error);
  }
};

export const me: RequestHandler = (req, res) => {
  sendSuccess(res, { user: req.user });
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(forgotPasswordSchema.parse(req.body));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(verifyOtpSchema.parse(req.body));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(resetPasswordSchema.parse(req.body));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resendOtp: RequestHandler = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    const result = await authService.resendOtp(
      String(email ?? ''),
      type === 'PASSWORD_RESET' ? 'PASSWORD_RESET' : 'EMAIL_VERIFICATION'
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
