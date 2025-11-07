import React, { createContext, useContext, useEffect, useState } from 'react';
import pb from '@/lib/pocketbase';

// A conservative user model: an object with unknown properties or null when not set.
export type UserModel = Record<string, unknown> | null;

type PBAuthStore = {
  model?: Record<string, unknown> | null;
  token?: string | null;
  save?: (token: string, record?: Record<string, unknown> | null) => void;
  clear?: () => void;
  // some SDKs provide an onChange hook; typed below where needed
};

interface AuthContextValue {
  user: UserModel;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  initializing?: boolean;
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
      const authStore = pb.authStore as unknown as PBAuthStore;
      const model = authStore?.model ?? null;
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
          try {
            // pb.authStore.save may not exist on all SDK versions; guard it.
            const authStore = pb.authStore as unknown as PBAuthStore;
            if (typeof authStore.save === 'function') {
              authStore.save(parsed.token, parsed.record ?? null);
            }
          } catch (saveErr) {
            console.warn('Failed to restore pb authStore session', saveErr);
          }
        }
      }
    } catch (e) {
      // Log session restore errors so lint doesn't complain about empty catches
      console.warn('Failed to restore session auth', e);
    }

    // run once immediately to hydrate
    handler();

    // Attempt to refresh the auth token. We try refresh and handle any errors.
    (async () => {
      try {
        await pb.collection('users').authRefresh();
        // update local state from refreshed store
        handler();
      } catch (e) {
        // refresh failed -> clear auth state and log the error
        try {
          pb.authStore.clear();
        } catch (er) {
          console.warn('Failed to clear auth store after refresh failure', er);
        }
        console.warn('Auth refresh failed', e);
        handler();
      }
    })();

    // Narrow the auth store type to check for an optional onChange handler without using `any`.
    const maybeWithOnChange = pb.authStore as unknown as {
      onChange?: (cb: () => void) => void | (() => void);
    };

    if (typeof maybeWithOnChange.onChange === 'function') {
      // onChange typically returns an unsubscribe function; call it on cleanup if provided
      const unsub = maybeWithOnChange.onChange(() => handler());
      return () => {
        try {
          if (typeof unsub === 'function') unsub();
        } catch (e) {
          console.warn('Error calling authStore unsubscribe', e);
        }
      };
    }

    // Fallback to polling if onChange is not available
    const id = setInterval(handler, 500);
    return () => clearInterval(id);
  }, []);

  const login = async (email: string, password: string, remember = true): Promise<void> => {
    await pb.collection('users').authWithPassword(email, password);
    // ensure the user's email is verified before considering them authenticated
  const model = (pb.authStore as unknown as PBAuthStore)?.model ?? null;
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
  const authStore = pb.authStore as unknown as PBAuthStore;
  const token = authStore.token;
  const record = authStore.model ?? null;
        sessionStorage.setItem('pb_auth_session', JSON.stringify({ token, record }));
        try {
          // remove the SDK's persistent local storage key to avoid cross-session persistence
          if (typeof localStorage !== 'undefined') localStorage.removeItem('pb_auth');
        } catch (e) {
          console.warn('Failed to remove localStorage pb_auth', e);
        }
      } else {
        // ensure any session key is cleared when remembering between sessions
        try {
          sessionStorage.removeItem('pb_auth_session');
        } catch (e) {
          console.warn('Failed to clear session auth key', e);
        }
      }
    } catch (e) {
      console.warn('Failed to persist auth preference', e);
    }

    setUser(model);
  };

  const logout = () => {
    pb.authStore.clear();
    try {
      sessionStorage.removeItem('pb_auth_session');
    } catch (e) {
      console.warn('Failed to remove session auth on logout', e);
    }
    setUser(null);
  };

  const value: AuthContextValue = {
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
