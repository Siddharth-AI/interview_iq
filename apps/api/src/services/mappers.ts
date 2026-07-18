import type {
  Answer,
  Assessment,
  Interview,
  Profile,
  Question,
  Resume,
} from '@prisma/client';
import type {
  AssessmentResponse,
  ExperienceEntry,
  ImprovedExample,
  InterviewResponse,
  InterviewSummary,
  ProfileResponse,
} from '@interview-iq/shared';

export function toProfileResponse(profile: Profile & { resume: Resume }): ProfileResponse {
  return {
    id: profile.id,
    resumeId: profile.resumeId,
    filename: profile.resume.filename,
    summary: profile.summary,
    skills: profile.skills,
    experience: (profile.experience as unknown as ExperienceEntry[]) ?? [],
    editedAt: profile.editedAt.toISOString(),
  };
}

export function toInterviewResponse(
  interview: Interview & {
    questions: Question[];
    answers: Answer[];
    assessment: { id: string } | null;
  },
): InterviewResponse {
  return {
    id: interview.id,
    role: interview.role,
    seniority: interview.seniority,
    jobDescription: interview.jobDescription,
    status: interview.status,
    questions: interview.questions.map((q) => ({ id: q.id, order: q.order, text: q.text })),
    answers: interview.answers.map((a) => ({
      questionId: a.questionId,
      text: a.text,
      updatedAt: a.updatedAt.toISOString(),
    })),
    assessmentId: interview.assessment?.id ?? null,
    createdAt: interview.createdAt.toISOString(),
  };
}

export function toInterviewSummary(
  interview: Interview & { assessment: { id: string; overallScore: number } | null },
): InterviewSummary {
  return {
    id: interview.id,
    role: interview.role,
    seniority: interview.seniority,
    status: interview.status,
    createdAt: interview.createdAt.toISOString(),
    overallScore: interview.assessment?.overallScore ?? null,
    assessmentId: interview.assessment?.id ?? null,
  };
}

export function toAssessmentResponse(
  assessment: Assessment & { interview: { role: string } },
): AssessmentResponse {
  return {
    id: assessment.id,
    interviewId: assessment.interviewId,
    role: assessment.interview.role,
    overallScore: assessment.overallScore,
    categoryScores: {
      relevance: assessment.relevanceScore,
      clarity: assessment.clarityScore,
      structure: assessment.structureScore,
      communication: assessment.communicationScore,
    },
    strengths: assessment.strengths,
    improvements: assessment.improvements,
    improvedExample: assessment.improvedExample as unknown as ImprovedExample,
    createdAt: assessment.createdAt.toISOString(),
  };
}
