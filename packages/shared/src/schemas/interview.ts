import { z } from 'zod';
import { seniorityEnum, interviewStatusEnum } from '../constants.js';

export const createInterviewSchema = z.object({
  profileId: z.string().uuid('A valid profile is required'),
  role: z.string().min(2, 'Target role is required').max(120).trim(),
  seniority: seniorityEnum,
  jobDescription: z.string().max(8000).optional(),
});
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

export interface QuestionResponse {
  id: string;
  order: number;
  text: string;
}

export interface AnswerResponse {
  questionId: string;
  text: string;
  updatedAt: string;
}

export interface InterviewResponse {
  id: string;
  role: string;
  seniority: z.infer<typeof seniorityEnum>;
  jobDescription: string | null;
  status: z.infer<typeof interviewStatusEnum>;
  questions: QuestionResponse[];
  answers: AnswerResponse[];
  assessmentId: string | null;
  createdAt: string;
}

export interface InterviewSummary {
  id: string;
  role: string;
  seniority: z.infer<typeof seniorityEnum>;
  status: z.infer<typeof interviewStatusEnum>;
  createdAt: string;
  overallScore: number | null;
  assessmentId: string | null;
}
