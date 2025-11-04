import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

interface AuthContextValue {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // restore auth from PocketBase authStore
    const model = pb.authStore.model;
    if (model) setUser(model);
    setLoading(false);

    // listen to changes
    const remove = pb.authStore.onChange(() => {
      setUser(pb.authStore.model ?? null);
    });

    return () => {
      if (remove && typeof remove === 'function') remove();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setUser(authData.record ?? pb.authStore.model);
      return authData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
