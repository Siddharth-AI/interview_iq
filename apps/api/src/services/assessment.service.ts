import type { AssessmentResponse } from '@interview-iq/shared';
import { notFound } from '../lib/errors';
import { assessmentRepository } from '../repositories/assessment.repository';
import { toAssessmentResponse } from './mappers';

export const assessmentService = {
  async getAssessment(id: string, userId: string): Promise<AssessmentResponse> {
    const assessment = await assessmentRepository.findByIdForUser(id, userId);
    if (!assessment) throw notFound('Assessment not found');
    return toAssessmentResponse(assessment);
  },
};
