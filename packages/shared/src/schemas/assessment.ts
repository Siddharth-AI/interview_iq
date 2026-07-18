import { z } from 'zod';
import { SCORE_MIN, SCORE_MAX } from '../constants.js';

const scoreValue = z.number().int().min(SCORE_MIN).max(SCORE_MAX);

/** One improved answer example the assessment surfaces for coaching value. */
export const improvedExampleSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string(),
  originalAnswer: z.string(),
  improvedAnswer: z.string().min(1),
  rationale: z.string().min(1),
});
export type ImprovedExample = z.infer<typeof improvedExampleSchema>;

/**
 * The full assessment shape. This doubles as the contract an AIProvider must satisfy
 * when scoring, so provider output is validated against it before persistence.
 */
export const assessmentResultSchema = z.object({
  overallScore: scoreValue,
  categoryScores: z.object({
    relevance: scoreValue,
    clarity: scoreValue,
    structure: scoreValue,
    communication: scoreValue,
  }),
  strengths: z.array(z.string().min(1).max(500)).min(1).max(10),
  improvements: z.array(z.string().min(1).max(500)).min(1).max(10),
  improvedExample: improvedExampleSchema,
});
export type AssessmentResult = z.infer<typeof assessmentResultSchema>;

export interface AssessmentResponse extends AssessmentResult {
  id: string;
  interviewId: string;
  role: string;
  createdAt: string;
}
