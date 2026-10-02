import { client } from './client';
import type { AuthUser } from '../types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string, device_name: string, app?: 'tradie' | 'member') =>
    client.post<LoginResponse>('/api/v1/auth/login', { email, password, device_name, app }),

  logout: () =>
    client.post('/api/v1/auth/logout'),

  refresh: (refresh_token: string) =>
    client.post<LoginResponse>('/api/v1/auth/refresh', { refresh_token }),

  registerDevice: (push_token: string, platform: 'ios' | 'android') =>
    client.post('/api/v1/auth/register-device', { push_token, platform }),
};
