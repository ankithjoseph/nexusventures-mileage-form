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
        // if authStore is valid, navigate to dashboard; otherwise to login
        if ((pb.authStore as any).isValid) {
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
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
