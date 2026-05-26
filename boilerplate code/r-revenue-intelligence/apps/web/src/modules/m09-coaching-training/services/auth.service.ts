import { apiClient } from '@/lib/api';
import { LoginResponse } from '@/types/auth.types';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },
};
