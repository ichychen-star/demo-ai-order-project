import axios, { AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
  errors: string[];
}

interface ApiErrorBody {
  message?: string;
  errors?: string[];
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message,
      errors: error.response?.data?.errors ?? [],
    };
    return Promise.reject(apiError);
  },
);

export default apiClient;
