import { z } from 'zod';

export const summarizeSchema = z.object({
  materialId: z.string().min(1),
});
