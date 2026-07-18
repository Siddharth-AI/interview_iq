import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';

export const assessmentRepository = {
  create(data: {
    interviewId: string;
    overallScore: number;
    relevanceScore: number;
    clarityScore: number;
    structureScore: number;
    communicationScore: number;
    strengths: string[];
    improvements: string[];
    improvedExample: Prisma.InputJsonValue;
  }) {
    return prisma.assessment.create({ data });
  },

  findByInterview(interviewId: string) {
    return prisma.assessment.findUnique({ where: { interviewId } });
  },

  /** Ownership is enforced by joining through the interview to the user. */
  findByIdForUser(id: string, userId: string) {
    return prisma.assessment.findFirst({
      where: { id, interview: { userId } },
      include: { interview: { select: { role: true } } },
    });
  },
};
