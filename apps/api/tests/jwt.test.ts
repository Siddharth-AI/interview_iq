import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  durationToMs,
} from '../src/lib/jwt';

describe('jwt utilities', () => {
  it('signs and verifies an access token round trip', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com' });
    expect(() => verifyAccessToken(`${token}x`)).toThrow();
  });

  it('hashes refresh tokens deterministically and never stores the raw token', () => {
    const { token, tokenHash } = generateRefreshToken();
    expect(tokenHash).not.toBe(token);
    expect(hashRefreshToken(token)).toBe(tokenHash);
  });

  it('parses duration strings to milliseconds', () => {
    expect(durationToMs('15m')).toBe(15 * 60_000);
    expect(durationToMs('7d')).toBe(7 * 86_400_000);
    expect(durationToMs('nonsense')).toBe(0);
  });
});
