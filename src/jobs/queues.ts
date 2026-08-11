import Bull from 'bull';
import { env } from '@/config/env.js';

const redisUrl = env.REDIS_URL ?? 'redis://localhost:6379';

const queueOptions: Bull.QueueOptions = {
  redis: redisUrl,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

export const aiSummaryQueue = new Bull('ai-summary', queueOptions);
export const notificationQueue = new Bull('notifications', queueOptions);

export const AI_SUMMARY_JOB = 'process-ai-summary';
export const REMINDER_NOTIFY_JOB = 'reminder-notify';
export const EVENT_REMINDER_JOB = 'event-reminder-notify';
