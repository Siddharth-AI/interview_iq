import type { User } from '@prisma/client';
import type { AuthUser, LoginInput, RegisterInput } from '@interview-iq/shared';
import { env } from '../config/env';
import { conflict, unauthorized } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  durationToMs,
} from '../lib/jwt';
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refresh-token.repository';

export interface IssuedSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueSession(user: User, userAgent?: string): Promise<IssuedSession> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const { token, tokenHash } = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash,
    expiresAt: refreshExpiresAt,
    userAgent,
  });

  return { user: toAuthUser(user), accessToken, refreshToken: token, refreshExpiresAt };
}

export const authService = {
  async register(input: RegisterInput, userAgent?: string): Promise<IssuedSession> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw conflict('An account with this email already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    return issueSession(user, userAgent);
  },

  async login(input: LoginInput, userAgent?: string): Promise<IssuedSession> {
    const user = await userRepository.findByEmail(input.email);
    // Verify against a real or dummy hash either way to reduce timing leakage.
    const ok = user
      ? await verifyPassword(input.password, user.passwordHash)
      : await verifyPassword(input.password, '$2a$12$0000000000000000000000000000000000000000000000000000');
    if (!user || !ok) throw unauthorized('Invalid email or password');

    return issueSession(user, userAgent);
  },

  async refresh(rawToken: string, userAgent?: string): Promise<IssuedSession> {
    const record = await refreshTokenRepository.findValidByHash(hashRefreshToken(rawToken));
    if (!record) throw unauthorized('Session expired, please sign in again');

    // Rotate: revoke the used token before issuing a new one.
    await refreshTokenRepository.revoke(record.id);

    const user = await userRepository.findById(record.userId);
    if (!user) throw unauthorized('Session is no longer valid');

    return issueSession(user, userAgent);
  },

  async logout(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw unauthorized();
    return toAuthUser(user);
  },
};
