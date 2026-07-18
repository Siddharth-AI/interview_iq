import { prisma } from '../database/prisma';

export const resumeRepository = {
  create(data: {
    userId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    rawText: string;
  }) {
    return prisma.resume.create({ data });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.resume.findFirst({ where: { id, userId, deletedAt: null } });
  },
};
