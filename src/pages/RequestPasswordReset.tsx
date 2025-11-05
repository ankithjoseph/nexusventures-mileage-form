import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// reCAPTCHA site key (Vite exposes it as import.meta.env)
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

async function loadRecaptcha(siteKey?: string) {
  if (!siteKey) return;
  if ((window as any).grecaptcha) return;
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load reCAPTCHA')); 
    document.head.appendChild(s);
  });
}

const RequestPasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (RECAPTCHA_SITE_KEY) {
      loadRecaptcha(RECAPTCHA_SITE_KEY).catch(e => console.warn('reCAPTCHA load failed', e));
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      // Get reCAPTCHA token (if configured)
      let recaptchaToken: string | undefined;
      if (RECAPTCHA_SITE_KEY) {
        try {
          const grecaptcha = (window as any).grecaptcha;
          if (grecaptcha && grecaptcha.execute) {
            recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'request_password_reset' });
          }
        } catch (e) {
          console.warn('reCAPTCHA execute failed', e);
        }
      }

      // Call server-side endpoint that applies rate-limits and recaptcha verification
      const resp = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        toast({ title: 'Request failed', description: json?.error || 'Unable to send reset email', variant: 'destructive' });
      } else {
        toast({ title: 'Reset email sent', description: json?.message || 'Check your email for the reset link.' });
        navigate('/login');
      }
    } catch (err: any) {
      console.error('request reset error', err);
      toast({ title: 'Request failed', description: err?.message || 'Unable to send reset email', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-lg font-semibold mb-2">Reset your password</h2>
        <p className="text-sm text-muted-foreground mb-4">Enter the email address associated with your account and we'll send a password reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rpr-email">Email</Label>
            <Input id="rpr-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RequestPasswordReset;