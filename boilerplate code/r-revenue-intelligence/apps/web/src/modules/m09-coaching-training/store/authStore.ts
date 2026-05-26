'use client';

import { create } from 'zustand';
import { User } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    const rawUser = localStorage.getItem('auth_user');
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;
    set({ token, user, isAuthenticated: Boolean(token && user) });
  },
  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `auth_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'auth_role=; path=/; max-age=0';
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));
