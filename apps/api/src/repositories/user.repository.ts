import { prisma } from '../database/prisma';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  },

  findById(id: string) {
    return prisma.user.findFirst({ where: { id } });
  },

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({
      data: { email: data.email.toLowerCase(), name: data.name, passwordHash: data.passwordHash },
    });
  },
};
