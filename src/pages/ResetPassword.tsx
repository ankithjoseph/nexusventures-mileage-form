import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import pb from '@/lib/pocketbase';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('token');
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token) return setError('Missing token');
    if (password !== passwordConfirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
  toast({ title: 'Password reset', description: 'Your password has been updated. You can now sign in.' });
  // prefer a referrer passed via location.state, otherwise use stored referrer from when the reset was requested
  const fallback = (location.state as any)?.from?.pathname || localStorage.getItem('auth_referrer') || '/';
  // clear stored referrer now that it's consumed
  try { localStorage.removeItem('auth_referrer'); } catch (e) { /* ignore */ }
  // navigate to login and pass the original referrer so login can redirect after sign-in
  navigate('/login', { replace: true, state: { from: { pathname: fallback } } });
    } catch (err: any) {
      console.error('confirm reset error', err);
      const message = err?.message || err?.data?.message || 'Failed to reset password';
      setError(message);
      // Surface immediate feedback via toast as well
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-lg font-semibold mb-2">Choose a new password</h2>
        <p className="text-sm text-muted-foreground mb-4">Enter a new password for your account.</p>
        {error && (
          <div className="text-destructive mb-4">
            {error}
            {/token|expired|invalid|not found/i.test(String(error)) && (
              <div className="mt-2 text-sm">
                <Link to="/login" className="underline">Request a new reset</Link>
                {' or '}
                <Link to="/login" className="underline">Sign up</Link>
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-password-confirm">Confirm password</Label>
            <Input id="reset-password-confirm" name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
