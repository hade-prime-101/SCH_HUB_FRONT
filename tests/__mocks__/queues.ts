const makeQueue = () => ({
  add       : jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  process   : jest.fn(),
  on        : jest.fn(),
  close     : jest.fn().mockResolvedValue(undefined),
  getJob    : jest.fn().mockResolvedValue(null),
  empty     : jest.fn().mockResolvedValue(undefined),
  pause     : jest.fn().mockResolvedValue(undefined),
  resume    : jest.fn().mockResolvedValue(undefined),
});

export const aiSummaryQueue    = makeQueue();
export const notificationQueue = makeQueue();

export const AI_SUMMARY_JOB    = 'process-ai-summary';
export const REMINDER_NOTIFY_JOB = 'reminder-notify';
export const EVENT_REMINDER_JOB  = 'event-reminder-notify';
