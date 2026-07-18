import bcrypt from 'bcryptjs';

// bcryptjs is a pure JS implementation, so it builds identically on every platform.
// argon2id is a stronger production choice; swap here if native builds are available.
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
