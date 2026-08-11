import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import * as c from './reminders.controller.js';

export const remindersRoutes = Router();

remindersRoutes.use(authenticate);

remindersRoutes.get('/', c.listReminders);
remindersRoutes.post('/', c.createReminder);
remindersRoutes.patch('/:id', c.updateReminder);
remindersRoutes.delete('/:id', c.deleteReminder);
remindersRoutes.patch('/:id/complete', c.completeReminder);
