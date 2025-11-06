import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import pb from '@/lib/pocketbase';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('Verification token missing');
        setLoading(false);
        return;
      }

      try {
        await pb.collection('users').confirmVerification(token);
        // try to refresh auth in case the user clicked the link while already authenticated
        try {
          await pb.collection('users').authRefresh();
        } catch (e) {
          // ignore refresh errors — user can sign in manually
        }

        toast({ title: 'Email verified', description: 'Your email was verified. You can now sign in.' });

        // Determine a safe redirect target. Prefer an explicit `returnTo` query
        // param (e.g. /verify?token=...&returnTo=/expense-report), then fall back
        // to a stored post-verification redirect (set by the signup page).
        const isSafePath = (p: string | null | undefined) => {
          if (!p || typeof p !== 'string') return false;
          // must be an internal path (starts with single slash), no protocol
          if (!p.startsWith('/')) return false;
          if (p.startsWith('//')) return false;
          if (p.includes('://')) return false;
          return true;
        };

        const explicitReturn = searchParams.get('returnTo');
        let redirectTo: string | null = null;
        if (isSafePath(explicitReturn)) {
          redirectTo = explicitReturn;
        } else {
          try {
            const raw = localStorage.getItem('post_verify_redirect');
            if (raw) {
              const parsed = JSON.parse(raw as string);
              const p = parsed?.path;
              const ts = parsed?.ts;
              const now = Date.now();
              const TTL = 5 * 60 * 1000; // 5 minutes
              // only honor the stored redirect if it's recent (within TTL)
              if (typeof ts === 'number' && now - ts <= TTL && isSafePath(p)) {
                redirectTo = p;
              } else {
                // expired or invalid -> remove it
                try {
                  localStorage.removeItem('post_verify_redirect');
                } catch (e) {}
              }
            }
          } catch (e) {
            // ignore parse/localStorage errors
          }
        }

        if (redirectTo) {
          try {
            localStorage.removeItem('post_verify_redirect');
          } catch (e) {}
          navigate(redirectTo, { replace: true });
        } else {
          // if authStore is valid, navigate to dashboard; otherwise to login
          if ((pb.authStore as any).isValid) {
            navigate('/', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('verify error', err);
        setError(err?.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        {loading ? (
          <div className="text-center">Verifying…</div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-center text-destructive">{error}</div>
            <div className="text-center">
              <Button onClick={() => navigate('/login')}>Back to sign in</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-lg font-semibold">Email verified</div>
            <div>Thanks — your email has been verified. You can now sign in.</div>
            <div>
              <Button onClick={() => navigate('/login')}>Sign in</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
