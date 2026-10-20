"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

export interface AccessRole {
  id: string;
  key: string;
  name: string;
  color: string;
}

interface User {
  id: string | number;
  username: string;
  permLevel: number;
  name?: string;
  /** What the person may do: ["*"] for administrators, otherwise explicit "resource.action" keys. */
  permissions: string[];
  isAdmin: boolean;
  accessRole?: AccessRole | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  /** can('patients.edit') */
  can: (permission: string) => boolean;
  /** create or edit on a resource: the old "level 2" */
  canWrite: (resource: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
  /** Re-read the current permissions from the server (after a role changes, or when returning to the tab). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'user';

const normalize = (raw: any): User => ({
  id: raw.id,
  username: raw.username,
  permLevel: raw.permLevel ?? 1,
  name: raw.name,
  permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  isAdmin: Boolean(raw.isAdmin) || (Array.isArray(raw.permissions) && raw.permissions.includes('*')),
  accessRole: raw.accessRole ?? null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (next: User | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const { data } = await authAPI.me();
      persist(normalize(data));
    } catch {
      // 401 is handled by the API client (signs out); anything else keeps the last known permissions
    }
  }, []);

  useEffect(() => {
    // Show the last known permissions straight away, then confirm them with the server.
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem(STORAGE_KEY);

    if (token && userData) {
      try {
        setUser(normalize(JSON.parse(userData)));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
    if (token) refresh();
  }, [refresh]);

  // Permissions can change while someone is working: re-check when they come back to the tab and every few minutes.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => refresh();
    const timer = setInterval(refresh, 5 * 60 * 1000);

    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [user?.id, refresh]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authAPI.login({ username, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      const { data } = await authAPI.me();

      persist(normalize(data));

      return true;
    } catch (error: any) {
      localStorage.removeItem('token');

      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    persist(null);
  };

  const value = useMemo<AuthContextType>(() => {
    const set = new Set(user?.permissions ?? []);
    const all = set.has('*');
    const can = (permission: string) => all || set.has(permission);

    return {
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      can,
      canWrite: (resource: string) => can(`${resource}.create`) || can(`${resource}.edit`),
      canAny: (...permissions: string[]) => permissions.some(can),
      refresh,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, refresh]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
