import { apiClient } from './client';
import type { LoginResponse, AuthProfile } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  profile: () => apiClient<AuthProfile>('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
