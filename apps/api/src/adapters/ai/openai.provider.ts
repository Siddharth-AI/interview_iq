import OpenAI from 'openai';
import {
  candidateProfileSchema,
  assessmentResultSchema,
  QUESTIONS_PER_INTERVIEW,
  type CandidateProfile,
  type AssessmentResult,
} from '@interview-iq/shared';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import type {
  AIProvider,
  GenerateQuestionsInput,
  ScoreInterviewInput,
} from './types';

/**
 * OpenAI-backed provider. Every model response is parsed as JSON and validated against
 * the shared schema. Invalid output throws, so the caller can fall back to the mock.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    this.model = env.OPENAI_MODEL;
  }

  private async complete(system: string, user: string): Promise<unknown> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty response');
    return JSON.parse(content) as unknown;
  }

  async extractProfile(resumeText: string): Promise<CandidateProfile> {
    const system =
      'You extract a structured candidate profile from resume text. Respond ONLY with JSON ' +
      'matching: { "summary": string, "skills": string[], "experience": ' +
      '[{ "title": string, "company": string, "duration": string, "highlights": string[] }] }.';
    const user = `Resume text:\n"""\n${resumeText.slice(0, 12000)}\n"""`;
    const raw = await this.complete(system, user);
    return candidateProfileSchema.parse(raw);
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<string[]> {
    const system =
      `You are a senior interviewer. Produce exactly ${QUESTIONS_PER_INTERVIEW} personalised ` +
      'interview questions. Respond ONLY with JSON: { "questions": string[] }.';
    const user = JSON.stringify({
      role: input.role,
      seniority: input.seniority,
      jobDescription: input.jobDescription ?? null,
      candidate: input.profile,
      instructions:
        'Questions must be specific to the candidate resume and target role, mixing behavioural and technical depth.',
    });
    const raw = (await this.complete(system, user)) as { questions?: unknown };
    const questions = Array.isArray(raw.questions)
      ? raw.questions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      : [];
    if (questions.length < QUESTIONS_PER_INTERVIEW) {
      throw new Error('OpenAI did not return enough questions');
    }
    return questions.slice(0, QUESTIONS_PER_INTERVIEW);
  }

  async scoreInterview(input: ScoreInterviewInput): Promise<AssessmentResult> {
    const system =
      'You are an expert interview assessor. Score the interview and respond ONLY with JSON ' +
      'matching: { "overallScore": number (0-100), "categoryScores": { "relevance": number, ' +
      '"clarity": number, "structure": number, "communication": number }, "strengths": string[], ' +
      '"improvements": string[], "improvedExample": { "questionId": string, "questionText": string, ' +
      '"originalAnswer": string, "improvedAnswer": string, "rationale": string } }. All scores are ' +
      'integers 0-100. Pick improvedExample from the weakest answer.';
    const user = JSON.stringify({
      role: input.role,
      seniority: input.seniority,
      candidate: input.profile,
      transcript: input.items,
    });
    const raw = await this.complete(system, user);
    return assessmentResultSchema.parse(raw);
  }
}

export function createOpenAIProvider(): OpenAIProvider {
  logger.info({ msg: 'AI provider initialised', provider: 'openai', model: env.OPENAI_MODEL });
  return new OpenAIProvider();
}
