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

    // If a session-based auth token was stored (user chose "remember me" = false),
    // restore it into the SDK authStore so page reloads during the same tab keep the session.
    try {
      const session = sessionStorage.getItem('pb_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.token) {
          // restore into the SDK's auth store (this updates in-memory state)
          // @ts-ignore
          pb.authStore.save(parsed.token, parsed.record ?? null);
        }
      }
    } catch (e) {
      // ignore session restore errors
      console.warn('Failed to restore session auth', e);
    }

    // run once immediately to hydrate
    handler();

    // Attempt to refresh the auth token if the SDK believes the store is valid.
    (async () => {
      try {
        // @ts-ignore
        if (pb.authStore?.isValid) {
          await pb.collection('users').authRefresh();
          // update local state from refreshed store
          handler();
        }
      } catch (e) {
        // refresh failed -> clear auth state
        try {
          pb.authStore.clear();
        } catch (er) {}
        handler();
      }
    })();

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
    // ensure the user's email is verified before considering them authenticated
    const model = pb.authStore.model ?? null;
    if (model && (model.verified === false || model.verified === 'false')) {
      // clear auth store and throw so UI can show a helpful message
      pb.authStore.clear();
      setUser(null);
      throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
    }
    // If the user chose not to 'remember' the login, store auth in sessionStorage
    // and remove the persistent local store (so the login lasts for this tab/session only).
    try {
      if (!remember) {
        const token = pb.authStore.token;
        const record = pb.authStore.model ?? null;
        sessionStorage.setItem('pb_auth_session', JSON.stringify({ token, record }));
        try {
          // remove the SDK's persistent local storage key to avoid cross-session persistence
          localStorage.removeItem('pb_auth');
        } catch (e) {
          // ignore if localStorage is not available
        }
      } else {
        // ensure any session key is cleared when remembering between sessions
        try {
          sessionStorage.removeItem('pb_auth_session');
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Failed to persist auth preference', e);
    }

    setUser(model);
    return auth;
  };

  const logout = () => {
    pb.authStore.clear();
    try {
      sessionStorage.removeItem('pb_auth_session');
    } catch (e) {}
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
