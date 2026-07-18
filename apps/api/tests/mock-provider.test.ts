import { describe, it, expect } from 'vitest';
import {
  candidateProfileSchema,
  assessmentResultSchema,
  QUESTIONS_PER_INTERVIEW,
} from '@interview-iq/shared';
import { MockAIProvider } from '../src/adapters/ai/mock.provider';

const provider = new MockAIProvider();

const sampleResume = `John Doe
Senior Software Engineer
Experienced with TypeScript, React, Node.js and PostgreSQL.
Built and scaled several production systems. Led a small team.`;

const profile = {
  summary: 'Senior engineer with strong TypeScript and React experience.',
  skills: ['TypeScript', 'React', 'Node.js'],
  experience: [],
};

describe('MockAIProvider', () => {
  it('extracts a schema-valid profile from resume text', async () => {
    const result = await provider.extractProfile(sampleResume);
    expect(() => candidateProfileSchema.parse(result)).not.toThrow();
    expect(result.skills).toContain('TypeScript');
  });

  it('generates exactly five personalised questions', async () => {
    const questions = await provider.generateQuestions({
      profile,
      role: 'Senior Fullstack Engineer',
      seniority: 'senior',
    });
    expect(questions).toHaveLength(QUESTIONS_PER_INTERVIEW);
    questions.forEach((q) => expect(q.length).toBeGreaterThan(0));
  });

  it('produces a schema-valid assessment with bounded scores', async () => {
    const result = await provider.scoreInterview({
      role: 'Senior Fullstack Engineer',
      seniority: 'senior',
      profile,
      items: [
        { questionId: '11111111-1111-1111-1111-111111111111', question: 'Tell me about TypeScript.', answer: 'I used TypeScript to build a large app. First I set up strict types, then I validated inputs, and as a result we caught bugs early.' },
        { questionId: '22222222-2222-2222-2222-222222222222', question: 'Describe a failure.', answer: 'A deploy failed. I rolled back and added a test.' },
      ],
    });
    expect(() => assessmentResultSchema.parse(result)).not.toThrow();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('is deterministic: identical input yields identical output', async () => {
    const input = {
      role: 'Backend Engineer',
      seniority: 'mid' as const,
      profile,
      items: [
        { questionId: '33333333-3333-3333-3333-333333333333', question: 'Q', answer: 'A structured answer with situation, task, action, and result.' },
      ],
    };
    const a = await provider.scoreInterview(input);
    const b = await provider.scoreInterview(input);
    expect(a).toEqual(b);
  });
});
