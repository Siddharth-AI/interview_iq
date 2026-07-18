import { prisma } from '../database/prisma';

export const answerRepository = {
  /**
   * Idempotent save. The unique constraint on (interviewId, questionId) means repeated
   * saves for the same question update in place instead of creating duplicates.
   */
  upsert(data: { interviewId: string; questionId: string; text: string }) {
    return prisma.answer.upsert({
      where: { questionId: data.questionId },
      create: data,
      update: { text: data.text },
    });
  },

  listForInterview(interviewId: string) {
    return prisma.answer.findMany({ where: { interviewId } });
  },
};
