import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

type UserModel = any;

interface AuthContextValue {
  user: UserModel;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserModel>(pb.authStore.model ?? null);

  useEffect(() => {
    const onChange = () => setUser(pb.authStore.model ?? null);
    // pocketbase has an authStore.onChange hook
    // PocketBase exposes authStore which can be observed; if not, fall back to polling
    if ((pb.authStore as any).onChange !== undefined) {
      try {
        (pb.authStore as any).onChange = onChange;
      } catch (e) {
        const id = setInterval(() => onChange(), 1000);
        return () => clearInterval(id);
      }
    } else {
      const id = setInterval(() => onChange(), 1000);
      return () => clearInterval(id);
    }
  }, []);

  const login = async (email: string, password: string, remember = true): Promise<any> => {
    const auth = await pb.collection('users').authWithPassword(email, password);
    setUser(pb.authStore.model ?? null);
    return auth;
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
