import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  name: z.string().min(1, 'Name is required').max(120).trim(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /** Present only in non cookie transports. The web client relies on the httpOnly cookie. */
  refreshToken?: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}
