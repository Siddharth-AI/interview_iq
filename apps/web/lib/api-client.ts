import type {
  AuthUser,
  ProfileResponse,
  UpdateProfileInput,
  CreateInterviewInput,
  InterviewResponse,
  AnswerResponse,
  SaveAnswerInput,
  AssessmentResponse,
  InterviewSummary,
} from '@interview-iq/shared';
import { apiRequest } from './api';

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/register', {
      method: 'POST',
      body,
    }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser; accessToken: string }>('/auth/login', { method: 'POST', body }),
  logout: () => apiRequest<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => apiRequest<{ user: AuthUser }>('/auth/me'),
};

export const resumeApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<ProfileResponse>('/resumes', { method: 'POST', body: form, isForm: true });
  },
};

export const profileApi = {
  get: (id: string) => apiRequest<ProfileResponse>(`/profiles/${id}`),
  update: (id: string, body: UpdateProfileInput) =>
    apiRequest<ProfileResponse>(`/profiles/${id}`, { method: 'PATCH', body }),
};

export const interviewApi = {
  create: (body: CreateInterviewInput) =>
    apiRequest<InterviewResponse>('/interviews', { method: 'POST', body }),
  get: (id: string) => apiRequest<InterviewResponse>(`/interviews/${id}`),
  saveAnswer: (id: string, body: SaveAnswerInput) =>
    apiRequest<AnswerResponse>(`/interviews/${id}/answers`, { method: 'POST', body }),
  complete: (id: string) =>
    apiRequest<AssessmentResponse>(`/interviews/${id}/complete`, { method: 'POST' }),
  history: () => apiRequest<InterviewSummary[]>('/interviews/history'),
};

export const assessmentApi = {
  get: (id: string) => apiRequest<AssessmentResponse>(`/assessments/${id}`),
};
