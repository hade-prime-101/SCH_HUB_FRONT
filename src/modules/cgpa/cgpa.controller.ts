import type { RequestHandler } from 'express';
import { cgpaService } from '@/modules/cgpa/cgpa.service.js';
import {
  calculateSchema,
  createCourseSchema,
  listCoursesSchema,
  updateCourseSchema,
} from '@/modules/cgpa/cgpa.validators.js';
import { sendSuccess } from '@/utils/response.js';

export const listCourses: RequestHandler = async (req, res, next) => {
  try {
    const courses = await cgpaService.listCourses(req.user!.id, listCoursesSchema.parse(req.query));
    sendSuccess(res, courses);
  } catch (error) {
    next(error);
  }
};

export const createCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await cgpaService.createCourse(req.user!.id, createCourseSchema.parse(req.body));
    sendSuccess(res, course, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCourse: RequestHandler = async (req, res, next) => {
  try {
    const course = await cgpaService.updateCourse(req.params.id, req.user!.id, updateCourseSchema.parse(req.body));
    sendSuccess(res, course);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse: RequestHandler = async (req, res, next) => {
  try {
    const result = await cgpaService.deleteCourse(req.params.id, req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const calculate: RequestHandler = async (req, res, next) => {
  try {
    const result = await cgpaService.calculate(req.user!.id, calculateSchema.parse(req.body));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getRecords: RequestHandler = async (req, res, next) => {
  try {
    const records = await cgpaService.getRecords(req.user!.id);
    sendSuccess(res, records);
  } catch (error) {
    next(error);
  }
};

export const getCurrentCGPA: RequestHandler = async (req, res, next) => {
  try {
    const result = await cgpaService.getCurrentCGPA(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
