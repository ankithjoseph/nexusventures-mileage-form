import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import pb from '@/lib/pocketbase';

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

const Auth = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  const oauthProviders = (import.meta.env.VITE_POCKETBASE_OAUTH_PROVIDERS || 'google').split(',').map(s => s.trim()).filter(Boolean);

  const redirectUri = `${window.location.origin}/oauth-callback`;

  const handleOAuth = (provider: string) => {
    // Redirect to PocketBase authorize endpoint. PKCE/etc. should be configured on the PocketBase side.
    const url = `${pocketBaseUrl}/oauth2/authorize/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-6 bg-card border rounded-md shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Welcome</h2>
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded ${tab === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setTab('login')}>Sign in</button>
            <button className={`px-3 py-1 rounded ${tab === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => setTab('signup')}>Sign up</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            {tab === 'login' ? <Login /> : <Signup />}
          </div>

          <div className="col-span-1 border-l pl-4">
            <h3 className="text-lg font-medium mb-2">Or continue with</h3>
            <div className="flex flex-col gap-3">
              {oauthProviders.includes('google') && (
                <button onClick={() => handleOAuth('google')} className="w-full px-4 py-2 border rounded flex items-center justify-center gap-2">
                  <img src="/assets/google-logo.png" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
              )}

              {/* other providers will appear here when configured */}

              <div className="text-sm text-muted-foreground mt-4">
                Signing in with a provider will redirect you to that provider to authenticate, then back to the app to complete sign in.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
