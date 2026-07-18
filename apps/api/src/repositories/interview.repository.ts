import type { InterviewStatus, Seniority } from '@prisma/client';
import { prisma } from '../database/prisma';

export const interviewRepository = {
  createWithQuestions(data: {
    userId: string;
    profileId: string;
    role: string;
    seniority: Seniority;
    jobDescription?: string;
    questions: string[];
  }) {
    return prisma.interview.create({
      data: {
        userId: data.userId,
        profileId: data.profileId,
        role: data.role,
        seniority: data.seniority,
        jobDescription: data.jobDescription ?? null,
        status: 'in_progress',
        questions: {
          create: data.questions.map((text, index) => ({ order: index + 1, text })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.interview.findFirst({
      where: { id, userId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        answers: true,
        assessment: { select: { id: true } },
        profile: true,
      },
    });
  },

  listForUser(userId: string) {
    return prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { assessment: { select: { id: true, overallScore: true } } },
    });
  },

  updateStatus(id: string, status: InterviewStatus) {
    return prisma.interview.update({ where: { id }, data: { status } });
  },
};
