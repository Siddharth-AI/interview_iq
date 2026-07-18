import { prisma } from '../database/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } });
  },

  findById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({
      data: { email: data.email.toLowerCase(), name: data.name, passwordHash: data.passwordHash },
    });
  },
};
