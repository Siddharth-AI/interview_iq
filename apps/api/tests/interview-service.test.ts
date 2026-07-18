import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shared AI mock so tests can assert whether scoring was invoked.
const mocks = vi.hoisted(() => ({ scoreInterview: vi.fn() }));

vi.mock('../src/adapters/ai', () => ({
  getAIProvider: () => ({
    name: 'mock',
    scoreInterview: mocks.scoreInterview,
    generateQuestions: vi.fn(),
    extractProfile: vi.fn(),
  }),
}));

vi.mock('../src/repositories/interview.repository', () => ({
  interviewRepository: { findByIdForUser: vi.fn(), updateStatus: vi.fn() },
}));
vi.mock('../src/repositories/answer.repository', () => ({
  answerRepository: { upsert: vi.fn() },
}));
vi.mock('../src/repositories/assessment.repository', () => ({
  assessmentRepository: { findByInterview: vi.fn(), create: vi.fn() },
}));
vi.mock('../src/repositories/profile.repository', () => ({
  profileRepository: { findByIdForUser: vi.fn() },
}));

import { interviewService } from '../src/services/interview.service';
import { interviewRepository } from '../src/repositories/interview.repository';
import { answerRepository } from '../src/repositories/answer.repository';
import { assessmentRepository } from '../src/repositories/assessment.repository';

const USER = 'user-1';
const Q1 = '11111111-1111-1111-1111-111111111111';
const Q2 = '22222222-2222-2222-2222-222222222222';

function baseInterview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'interview-1',
    userId: USER,
    role: 'Senior Fullstack Engineer',
    seniority: 'senior',
    status: 'in_progress',
    profile: { summary: 's', skills: ['TS'], experience: [] },
    questions: [
      { id: Q1, order: 1, text: 'Question one' },
      { id: Q2, order: 2, text: 'Question two' },
    ],
    answers: [
      { questionId: Q1, text: 'answer one' },
      { questionId: Q2, text: 'answer two' },
    ],
    assessment: null,
    ...overrides,
  };
}

const dbAssessment = {
  id: 'assessment-1',
  interviewId: 'interview-1',
  overallScore: 80,
  relevanceScore: 82,
  clarityScore: 78,
  structureScore: 76,
  communicationScore: 84,
  strengths: ['Clear'],
  improvements: ['Use STAR'],
  improvedExample: {
    questionId: Q1,
    questionText: 'Question one',
    originalAnswer: 'answer one',
    improvedAnswer: 'better',
    rationale: 'why',
  },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('interviewService.saveAnswer', () => {
  it('upserts the answer idempotently and returns it', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(baseInterview());
    (answerRepository.upsert as any).mockResolvedValue({
      questionId: Q1,
      text: 'new text',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const result = await interviewService.saveAnswer('interview-1', USER, {
      questionId: Q1,
      text: 'new text',
    });

    expect(answerRepository.upsert).toHaveBeenCalledWith({
      interviewId: 'interview-1',
      questionId: Q1,
      text: 'new text',
    });
    expect(result.questionId).toBe(Q1);
    expect(result.text).toBe('new text');
  });

  it('refuses to edit a completed interview', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(
      baseInterview({ status: 'completed' }),
    );
    await expect(
      interviewService.saveAnswer('interview-1', USER, { questionId: Q1, text: 'x' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects a question that does not belong to the interview', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(baseInterview());
    await expect(
      interviewService.saveAnswer('interview-1', USER, {
        questionId: '99999999-9999-9999-9999-999999999999',
        text: 'x',
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('interviewService.completeInterview', () => {
  it('is idempotent: returns the existing assessment without re-scoring', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(baseInterview());
    (assessmentRepository.findByInterview as any).mockResolvedValue(dbAssessment);

    const result = await interviewService.completeInterview('interview-1', USER);

    expect(mocks.scoreInterview).not.toHaveBeenCalled();
    expect(assessmentRepository.create).not.toHaveBeenCalled();
    expect(result.id).toBe('assessment-1');
    expect(result.role).toBe('Senior Fullstack Engineer');
  });

  it('blocks completion when answers are missing', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(
      baseInterview({ answers: [{ questionId: Q1, text: 'only one' }] }),
    );
    (assessmentRepository.findByInterview as any).mockResolvedValue(null);

    await expect(
      interviewService.completeInterview('interview-1', USER),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(mocks.scoreInterview).not.toHaveBeenCalled();
  });

  it('scores, persists, and marks the interview complete on the happy path', async () => {
    (interviewRepository.findByIdForUser as any).mockResolvedValue(baseInterview());
    (assessmentRepository.findByInterview as any).mockResolvedValue(null);
    mocks.scoreInterview.mockResolvedValue({
      overallScore: 80,
      categoryScores: { relevance: 82, clarity: 78, structure: 76, communication: 84 },
      strengths: ['Clear'],
      improvements: ['Use STAR'],
      improvedExample: dbAssessment.improvedExample,
    });
    (assessmentRepository.create as any).mockResolvedValue(dbAssessment);

    const result = await interviewService.completeInterview('interview-1', USER);

    expect(mocks.scoreInterview).toHaveBeenCalledOnce();
    expect(assessmentRepository.create).toHaveBeenCalledOnce();
    expect(interviewRepository.updateStatus).toHaveBeenCalledWith('interview-1', 'completed');
    expect(result.overallScore).toBe(80);
  });
});
