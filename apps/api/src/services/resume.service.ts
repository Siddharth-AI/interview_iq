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
