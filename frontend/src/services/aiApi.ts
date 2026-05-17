import apiClient from './apiClient';
import type {
  AiParseTextRequest,
  AiParseResponse,
  AiGenerateRequest,
  AiGenerateResponse,
} from '@/types/ai';

export const aiApi = {
  parseText: (data: AiParseTextRequest): Promise<AiParseResponse> =>
    apiClient.post<AiParseResponse>('/api/ai/parse-text', data).then((r) => r.data),

  parsePdf: (file: File): Promise<AiParseResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<AiParseResponse>('/api/ai/parse-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  generateSummary: (data: AiGenerateRequest): Promise<AiGenerateResponse> =>
    apiClient
      .post<AiGenerateResponse>('/api/ai/generate-summary', data)
      .then((r) => r.data),

  generateEmail: (data: AiGenerateRequest): Promise<AiGenerateResponse> =>
    apiClient
      .post<AiGenerateResponse>('/api/ai/generate-email', data)
      .then((r) => r.data),
};
