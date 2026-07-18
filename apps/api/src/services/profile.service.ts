import type { ProfileResponse, UpdateProfileInput } from '@interview-iq/shared';
import { notFound } from '../lib/errors';
import { profileRepository } from '../repositories/profile.repository';
import { toProfileResponse } from './mappers';

export const profileService = {
  async getProfile(id: string, userId: string): Promise<ProfileResponse> {
    const profile = await profileRepository.findByIdForUser(id, userId);
    if (!profile) throw notFound('Profile not found');
    return toProfileResponse(profile);
  },

  async updateProfile(
    id: string,
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    const result = await profileRepository.update(id, userId, {
      summary: input.summary,
      skills: input.skills,
      experience: input.experience,
    });
    if (result.count === 0) throw notFound('Profile not found');

    const profile = await profileRepository.findByIdForUser(id, userId);
    if (!profile) throw notFound('Profile not found');
    return toProfileResponse(profile);
  },
};
