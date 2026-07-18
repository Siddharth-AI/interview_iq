import { z } from 'zod';

/**
 * Saving an answer is idempotent. The client sends the questionId plus the current text.
 * The server upserts on (interviewId, questionId), so repeated saves never duplicate.
 * An optional clientRequestId lets the server dedupe rapid retries of the same save.
 */
export const saveAnswerSchema = z.object({
  questionId: z.string().min(1, 'A valid question is required'),
  text: z.string().max(10000).default(''),
  clientRequestId: z.string().optional(),
});
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
