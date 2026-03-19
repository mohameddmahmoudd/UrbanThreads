'use client';

import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { AuthResponse, User } from '@/types/api.types';

export function useAuth() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setUser(res.user as User);
    return res;
  };

  const register = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/register', { email, password });
    setUser(res.user as User);
    return res;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    router.push('/login');
  };

  const fetchProfile = async () => {
    try {
      const profile = await api.get<User>('/users/me');
      setUser(profile);
      return profile;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      }
      return null;
    }
  };

  return { user, login, register, logout, fetchProfile };
}
