/**
 * Authentication state management using Zustand
 */
import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  checkAuth: () => {
    const user = api.getCurrentUser();
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
}));
