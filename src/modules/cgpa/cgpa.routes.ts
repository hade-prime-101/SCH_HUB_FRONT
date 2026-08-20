import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import {
  calculate,
  createCourse,
  deleteCourse,
  getCurrentCGPA,
  getRecords,
  listCourses,
  updateCourse,
} from '@/modules/cgpa/cgpa.controller.js';

export const cgpaRoutes = Router();

cgpaRoutes.use(authenticate);

cgpaRoutes.get('/courses', listCourses);
cgpaRoutes.post('/courses', createCourse);
cgpaRoutes.patch('/courses/:id', updateCourse);
cgpaRoutes.delete('/courses/:id', deleteCourse);

cgpaRoutes.post('/calculate', calculate);
cgpaRoutes.get('/records', getRecords);
cgpaRoutes.get('/records/current', getCurrentCGPA);
cgpaRoutes.get('/current', getCurrentCGPA);
