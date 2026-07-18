import { z } from 'zod';

/**
 * Domain constants shared between the API and the web client.
 * Kept in one place so validation, types, and UI options never drift apart.
 */

export const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'] as const;
export const seniorityEnum = z.enum(SENIORITY_LEVELS);
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const INTERVIEW_STATUSES = ['setup', 'in_progress', 'completed'] as const;
export const interviewStatusEnum = z.enum(INTERVIEW_STATUSES);
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const SCORE_CATEGORIES = ['relevance', 'clarity', 'structure', 'communication'] as const;
export const scoreCategoryEnum = z.enum(SCORE_CATEGORIES);
export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

export const QUESTIONS_PER_INTERVIEW = 5;

/** Upload rules. The server is the source of truth; the client mirrors these for fast feedback. */
export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export type AllowedResumeMimeType = (typeof ALLOWED_RESUME_MIME_TYPES)[number];

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.docx'] as const;

export const DEFAULT_MAX_FILE_SIZE_MB = 5;

/** Score bounds. Every score in the product is an integer 0..100. */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
