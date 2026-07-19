import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { ProfileResponse } from '@interview-iq/shared';
import { unprocessable } from '../lib/errors';
import { logger } from '../lib/logger';
import { extractResumeText } from '../adapters/file/resume-parser';
import { getStorage } from '../adapters/storage/storage';
import { getAIProvider } from '../adapters/ai';
import { resumeRepository } from '../repositories/resume.repository';
import { profileRepository } from '../repositories/profile.repository';
import { toProfileResponse } from './mappers';

// Signals that a document is actually a resume. A real resume matches several of these;
// an unrelated PDF (an invoice, an article) matches few, so we reject it before spending
// an AI call or creating a garbage profile.
const RESUME_SIGNALS: RegExp[] = [
  /\bexperience\b/,
  /\beducation\b/,
  /\bskills?\b/,
  /\bprojects?\b/,
  /\b(employment|internship|intern)\b/,
  /\b(summary|objective|profile)\b/,
  /\b(certification|certificate)\b/,
  /\b(bachelor|master|b\.?tech|m\.?tech|b\.?sc|m\.?sc|degree|diploma)\b/,
  /\b(university|college|institute)\b/,
  /\b(engineer|developer|manager|analyst|designer|consultant|architect|scientist)\b/,
  /[\w.+-]+@[\w-]+\.[\w.]+/, // an email address
  /\b(19|20)\d{2}\b/, // a year, common in date ranges
];

const MIN_RESUME_SIGNALS = 3;

/** Heuristic content check: does the extracted text read like a resume? */
export function looksLikeResume(text: string): boolean {
  const lower = text.toLowerCase();
  const hits = RESUME_SIGNALS.reduce((count, pattern) => count + (pattern.test(lower) ? 1 : 0), 0);
  return hits >= MIN_RESUME_SIGNALS;
}

export const resumeService = {
  /**
   * Full upload pipeline: extract text, derive a candidate profile via the AI provider,
   * persist the file to storage, and create the resume plus draft profile records.
   */
  async processUpload(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ): Promise<ProfileResponse> {
    const text = await extractResumeText(file.buffer, file.mimetype);
    if (text.trim().length < 30) {
      throw unprocessable('This resume appears to be empty or unreadable');
    }
    if (!looksLikeResume(text)) {
      throw unprocessable(
        'This file does not look like a resume. Please upload your resume as a PDF or DOCX.',
      );
    }

    const ai = getAIProvider();
    const profileData = await ai.extractProfile(text);

    const storage = getStorage();
    const objectKey = `${userId}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    await storage.save(objectKey, file.buffer, file.mimetype);

    const resume = await resumeRepository.create({
      userId,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: objectKey,
      rawText: text,
    });

    const profile = await profileRepository.create({
      userId,
      resumeId: resume.id,
      summary: profileData.summary,
      skills: profileData.skills,
      experience: profileData.experience,
    });

    logger.info({ msg: 'Resume processed', userId, resumeId: resume.id, provider: ai.name });
    return toProfileResponse({ ...profile, resume });
  },
};
