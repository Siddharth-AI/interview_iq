import type { CandidateProfile, AssessmentResult, Seniority } from '@interview-iq/shared';

export interface GenerateQuestionsInput {
  profile: CandidateProfile;
  role: string;
  seniority: Seniority;
  jobDescription?: string;
}

export interface ScoreQuestionAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export interface ScoreInterviewInput {
  role: string;
  seniority: Seniority;
  profile: CandidateProfile;
  items: ScoreQuestionAnswer[];
}

/**
 * The AI boundary. Every capability the product needs from an AI provider lives here,
 * so the concrete provider (OpenAI, mock, or a future one) is fully swappable and testable.
 * Implementations MUST return data already validated against the shared schemas.
 */
export interface AIProvider {
  readonly name: string;
  extractProfile(resumeText: string): Promise<CandidateProfile>;
  generateQuestions(input: GenerateQuestionsInput): Promise<string[]>;
  scoreInterview(input: ScoreInterviewInput): Promise<AssessmentResult>;
}
