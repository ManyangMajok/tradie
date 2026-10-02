import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@tradify/shared';
import { configureApiClient } from '@tradify/shared';

const TOKEN_KEY = 'tradify_access_token';
const REFRESH_KEY = 'tradify_refresh_token';
const USER_KEY = 'tradify_user';
const ONBOARDING_KEY = 'tradify_onboarding_done';

interface AuthState {
  isReady: boolean;
  isOnboardingDone: boolean;
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
  markOnboardingDone: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  isOnboardingDone: false,
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
    // Note: ONBOARDING_KEY is intentionally not cleared — persists per device across sign-outs
    set({ token: null, user: null });
  },

  markOnboardingDone: async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    set({ isOnboardingDone: true });
  },

  hydrate: async () => {
    const [token, userJson, onboardingRaw] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
      SecureStore.getItemAsync(ONBOARDING_KEY),
    ]);
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    configureApiClient({
      baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
      getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
      onUnauthorized: () => useAuthStore.getState().clearAuth(),
    });
    set({ isReady: true, token, user, isOnboardingDone: !!onboardingRaw });
  },
}));
