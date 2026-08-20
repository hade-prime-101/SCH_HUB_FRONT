import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import * as c from './notifications.controller.js';

export const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

notificationsRoutes.get('/', c.listNotifications);
notificationsRoutes.patch('/read-all', c.markAllRead);
notificationsRoutes.patch('/:id/read', c.markRead);
notificationsRoutes.delete('/:id', c.deleteNotification);

// Notification preferences / settings
notificationsRoutes.get('/settings', c.getSettings);
notificationsRoutes.patch('/settings', c.updateSettings);
