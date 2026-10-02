import { Platform } from 'react-native';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@tradify/shared';
import { configureApiClient } from '@tradify/shared';

const TOKEN_KEY = 'tradify_member_access_token';
const USER_KEY = 'tradify_member_user';
const REFRESH_KEY = 'tradify_member_refresh_token';

interface AuthState {
  isReady: boolean;
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  token: null,
  user: null,

  setAuth: async (token, refreshToken, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    configureApiClient({
      baseURL: process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000'),
      getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
      onUnauthorized: () => useAuthStore.getState().clearAuth(),
    });
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    const user = userJson ? JSON.parse(userJson) as AuthUser : null;
    set({ isReady: true, token, user });
  },
}));
