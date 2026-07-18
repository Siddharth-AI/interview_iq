import type { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';

export const profileRepository = {
  create(data: {
    userId: string;
    resumeId: string;
    summary: string;
    skills: string[];
    experience: Prisma.InputJsonValue;
  }) {
    return prisma.profile.create({ data });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.profile.findFirst({
      where: { id, userId },
      include: { resume: true },
    });
  },

  update(
    id: string,
    userId: string,
    data: { summary: string; skills: string[]; experience: Prisma.InputJsonValue },
  ) {
    // updateMany enforces the ownership filter; returns count so the service can 404.
    return prisma.profile.updateMany({ where: { id, userId }, data });
  },
};
