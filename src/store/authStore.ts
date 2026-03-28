import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  role: 'citizen' | 'lawyer' | 'admin' | string;
  full_name: string;
  plan?: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;

  login: (payload: { accessToken: string; user: AuthUser }) => void;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  login: ({ accessToken, user }) => set({ accessToken, user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));

