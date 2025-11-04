import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import pb from '@/lib/pocketbase';

const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const provider = params.get('provider') || params.get('state') || 'google';

      if (!code) {
        setError('No code present in the URL.');
        setLoading(false);
        return;
      }

      try {
        // Try a couple of possible SDK methods to exchange the code for a session.
        // PocketBase SDK evolves; try the most likely calls in order and stop on first success.
        let done = false;
        const attempts: Array<() => Promise<any>> = [];

        // 1) try top-level exchange method
        attempts.push(async () => {
          // some SDKs expose a method like exchangeCodeForSession
          const anyPb: any = pb as any;
          if (typeof anyPb.exchangeCodeForSession === 'function') {
            return await anyPb.exchangeCodeForSession(code);
          }
          throw new Error('exchangeCodeForSession not available');
        });

        // 2) try collection-level authWithOAuth2/provider exchange
        attempts.push(async () => {
          const anyPb: any = pb as any;
          if (anyPb.collection && typeof anyPb.collection === 'function') {
            // try possible method names
            const coll = anyPb.collection('users');
            if (coll && typeof coll.authWithOAuth2 === 'function') {
              return await coll.authWithOAuth2(provider, code);
            }
            if (coll && typeof coll.exchangeCodeForSession === 'function') {
              return await coll.exchangeCodeForSession(code);
            }
          }
          throw new Error('collection exchange not available');
        });

        // 3) try auth client helper
        attempts.push(async () => {
          const anyPb: any = pb as any;
          if (anyPb.auth && typeof anyPb.auth.exchangeCodeForSession === 'function') {
            return await anyPb.auth.exchangeCodeForSession(code);
          }
          throw new Error('auth.exchangeCodeForSession not available');
        });

        let lastErr: any = null;
        for (const attempt of attempts) {
          try {
            const res = await attempt();
            // success if no exception
            console.info('OAuth exchange result', res);
            toast.success('Signed in successfully');
            navigate('/');
            done = true;
            break;
          } catch (err: any) {
            lastErr = err;
            console.warn('OAuth attempt failed', err);
            continue;
          }
        }

        if (!done) {
          console.error('OAuth exchange failed:', lastErr);
          setError('Failed to complete OAuth sign-in automatically. You may need to finish sign-in in PocketBase or check your OAuth configuration.');
          toast.error('OAuth sign-in failed');
        }
      } catch (err: any) {
        console.error('OAuth callback error', err);
        setError(err?.message || 'Unknown error');
        toast.error('OAuth sign-in failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg p-6 bg-card border rounded-md shadow text-center">
        {loading && <div>Finalizing sign-in...</div>}
        {!loading && error && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Sign-in incomplete</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <p className="text-sm mb-4">If you see a PocketBase page in the redirect flow, complete the sign-in there. Otherwise double-check your PocketBase OAuth provider configuration and redirect URIs.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => window.location.href = window.location.origin} className="px-3 py-2 border rounded">Home</button>
              <button onClick={() => window.location.reload()} className="px-3 py-2 border rounded">Retry</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
