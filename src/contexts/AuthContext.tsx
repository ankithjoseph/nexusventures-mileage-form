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
    // Prefer PocketBase's authStore.onChange if available. It's more efficient
    // than polling and doesn't require touching SDK internals.
    let didInit = false;
    const handler = () => {
      const model = pb.authStore.model ?? null;
      setUser(model);
      if (!didInit) {
        didInit = true;
        setInitializing(false);
      }
    };

    // run once immediately to hydrate
    handler();

    const authStoreAny = pb.authStore as any;
    if (typeof authStoreAny.onChange === 'function') {
      // onChange typically returns an unsubscribe function; call it on cleanup if provided
      const unsub = authStoreAny.onChange(() => handler());
      return () => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch (e) {
          // ignore unsubscribe errors
        }
      };
    }

    // Fallback to polling if onChange is not available
    const id = setInterval(handler, 500);
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
