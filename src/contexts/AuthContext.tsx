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
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Poll authStore for changes. This is safe and avoids mutating SDK internals.
    let lastModelId = pb.authStore.model?.id ?? null;
    const sync = () => {
      const model = pb.authStore.model ?? null;
      const modelId = model?.id ?? null;
      if (modelId !== lastModelId) {
        lastModelId = modelId;
        setUser(model);
      }
      // also ensure we update on startup
      if (initializing) setInitializing(false);
    };

    // run once immediately
    sync();

    const id = setInterval(sync, 500);
    return () => clearInterval(id);
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

  const value: AuthContextValue & { initializing?: boolean } = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
    initializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
