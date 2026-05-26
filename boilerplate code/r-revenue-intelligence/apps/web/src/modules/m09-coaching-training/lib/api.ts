import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    if (typeof window !== 'undefined' && axiosError.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      document.cookie = 'auth_token=; path=/; max-age=0';
      document.cookie = 'auth_role=; path=/; max-age=0';
      window.location.href = '/login';
    }

    const message = axiosError.response?.data?.message;
    const cleanMessage = Array.isArray(message)
      ? message.join(', ')
      : message || axiosError.message || 'An unexpected error occurred';
    return Promise.reject(new Error(cleanMessage));
  }
);

export default apiClient;
