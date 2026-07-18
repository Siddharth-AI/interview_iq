import { z } from 'zod';

/** A single work experience entry extracted from the resume. */
export const experienceEntrySchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).optional().default(''),
  duration: z.string().max(120).optional().default(''),
  highlights: z.array(z.string().max(500)).max(20).optional().default([]),
});
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;

/**
 * The candidate profile the user reviews and edits before starting.
 * This is also the exact shape an AIProvider must return from extraction,
 * so provider output is validated against it.
 */
export const candidateProfileSchema = z.object({
  summary: z.string().min(1, 'Summary is required').max(2000),
  skills: z.array(z.string().min(1).max(80)).max(60).default([]),
  experience: z.array(experienceEntrySchema).max(30).default([]),
});
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

/** Payload the user submits when saving edits to the extracted profile. */
export const updateProfileSchema = candidateProfileSchema;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface ProfileResponse extends CandidateProfile {
  id: string;
  resumeId: string;
  filename: string;
  editedAt: string;
}
