import type {
  AnswerResponse,
  AssessmentResponse,
  CreateInterviewInput,
  InterviewResponse,
  InterviewSummary,
  SaveAnswerInput,
} from '@interview-iq/shared';
import { badRequest, forbidden, notFound, unprocessable } from '../lib/errors';
import { logger } from '../lib/logger';
import { getAIProvider } from '../adapters/ai';
import { interviewRepository } from '../repositories/interview.repository';
import { profileRepository } from '../repositories/profile.repository';
import { answerRepository } from '../repositories/answer.repository';
import { assessmentRepository } from '../repositories/assessment.repository';
import type { CandidateProfile, ExperienceEntry } from '@interview-iq/shared';
import { toInterviewResponse, toInterviewSummary, toAssessmentResponse } from './mappers';

export const interviewService = {
  async createInterview(
    userId: string,
    input: CreateInterviewInput,
  ): Promise<InterviewResponse> {
    const profile = await profileRepository.findByIdForUser(input.profileId, userId);
    if (!profile) throw notFound('Profile not found');

    const candidate: CandidateProfile = {
      summary: profile.summary,
      skills: profile.skills,
      experience: (profile.experience as unknown as ExperienceEntry[]) ?? [],
    };

    const ai = getAIProvider();
    const questions = await ai.generateQuestions({
      profile: candidate,
      role: input.role,
      seniority: input.seniority,
      jobDescription: input.jobDescription,
    });

    const interview = await interviewRepository.createWithQuestions({
      userId,
      profileId: input.profileId,
      role: input.role,
      seniority: input.seniority,
      jobDescription: input.jobDescription,
      questions,
    });

    logger.info({ msg: 'Interview created', userId, interviewId: interview.id, provider: ai.name });
    return toInterviewResponse({ ...interview, answers: [], assessment: null });
  },

  async getInterview(id: string, userId: string): Promise<InterviewResponse> {
    const interview = await interviewRepository.findByIdForUser(id, userId);
    if (!interview) throw notFound('Interview not found');
    return toInterviewResponse(interview);
  },

  async saveAnswer(
    id: string,
    userId: string,
    input: SaveAnswerInput,
  ): Promise<AnswerResponse> {
    const interview = await interviewRepository.findByIdForUser(id, userId);
    if (!interview) throw notFound('Interview not found');
    if (interview.status === 'completed') {
      throw forbidden('This interview is already complete and cannot be edited');
    }

    const question = interview.questions.find((q) => q.id === input.questionId);
    if (!question) throw badRequest('That question does not belong to this interview');

    const answer = await answerRepository.upsert({
      interviewId: id,
      questionId: input.questionId,
      text: input.text,
    });

    return {
      questionId: answer.questionId,
      text: answer.text,
      updatedAt: answer.updatedAt.toISOString(),
    };
  },

  /**
   * Completes the interview and produces the assessment. Idempotent: if an assessment
   * already exists it is returned unchanged, so duplicate or retried complete calls are safe.
   */
  async completeInterview(id: string, userId: string): Promise<AssessmentResponse> {
    const interview = await interviewRepository.findByIdForUser(id, userId);
    if (!interview) throw notFound('Interview not found');

    const existing = await assessmentRepository.findByInterview(id);
    if (existing) {
      return toAssessmentResponse({ ...existing, interview: { role: interview.role } });
    }

    const answersByQuestion = new Map(interview.answers.map((a) => [a.questionId, a.text]));
    const unanswered = interview.questions.filter(
      (q) => !(answersByQuestion.get(q.id) ?? '').trim(),
    );
    if (unanswered.length > 0) {
      throw unprocessable('Answer every question before completing the interview', {
        unansweredQuestionIds: unanswered.map((q) => q.id),
      });
    }

    const candidate: CandidateProfile = {
      summary: interview.profile.summary,
      skills: interview.profile.skills,
      experience: (interview.profile.experience as unknown as ExperienceEntry[]) ?? [],
    };

    const ai = getAIProvider();
    const result = await ai.scoreInterview({
      role: interview.role,
      seniority: interview.seniority,
      profile: candidate,
      items: interview.questions.map((q) => ({
        questionId: q.id,
        question: q.text,
        answer: answersByQuestion.get(q.id) ?? '',
      })),
    });

    const assessment = await assessmentRepository.create({
      interviewId: id,
      overallScore: result.overallScore,
      relevanceScore: result.categoryScores.relevance,
      clarityScore: result.categoryScores.clarity,
      structureScore: result.categoryScores.structure,
      communicationScore: result.categoryScores.communication,
      strengths: result.strengths,
      improvements: result.improvements,
      improvedExample: result.improvedExample,
    });

    await interviewRepository.updateStatus(id, 'completed');
    logger.info({ msg: 'Interview completed', userId, interviewId: id, provider: ai.name });

    return toAssessmentResponse({ ...assessment, interview: { role: interview.role } });
  },

  async listHistory(userId: string): Promise<InterviewSummary[]> {
    const interviews = await interviewRepository.listForUser(userId);
    return interviews.map(toInterviewSummary);
  },
};
