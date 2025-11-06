import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import nexusLogo from '@/assets/nexus-ventures-logo.png';
import pb from '@/lib/pocketbase';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Reset fields
  const [resetEmail, setResetEmail] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Load reCAPTCHA script when switching to reset mode
  useEffect(() => {
    if (mode === 'reset') {
      const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
      if (RECAPTCHA_SITE_KEY && !(window as any).grecaptcha) {
        const s = document.createElement('script');
        s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        s.async = true;
        document.head.appendChild(s);
      }
    }
  }, [mode]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await login(email, password, remember);
      toast({ title: 'Signed in', description: 'Welcome back!' });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error', err);
      toast({ 
        title: 'Sign in failed', 
        description: err?.message || 'Invalid credentials. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !name.trim()) {
      toast({ title: 'Name required', description: 'Please enter your full name', variant: 'destructive' });
      return;
    }
    if (password !== passwordConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
  // store where the user started from so we can return them after verifying their email
  try { localStorage.setItem('auth_referrer', (location.state as any)?.from?.pathname || location.pathname || '/'); } catch (e) { /* ignore */ }
  setLoading(true);
    try {
      await pb.collection('users').create({ email, password, passwordConfirm, name });
        try {
          // Use server endpoint so we can persist referrer on the user record and include it in the
          // verification email template (server will call PocketBase.requestVerification).
          await fetch('/api/request-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, referrer: localStorage.getItem('auth_referrer') || (location.state as any)?.from?.pathname || location.pathname || '/' }),
          });
        } catch (reqErr) {
          console.warn('requestVerification failed', reqErr);
        }
      toast({ title: 'Verification sent', description: 'Check your email for a verification link before signing in.' });
      setMode('login');
    } catch (err: any) {
      console.error('Signup error', err);
      toast({ title: 'Signup failed', description: err?.message || 'Unable to create account', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
  // record where the user initiated the reset so the reset page can return them there after completing
  try { localStorage.setItem('auth_referrer', (location.state as any)?.from?.pathname || location.pathname || '/'); } catch (e) { /* ignore */ }
  setLoading(true);
    try {
      // Get reCAPTCHA token (if configured)
      let recaptchaToken: string | undefined;
      const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
      if (RECAPTCHA_SITE_KEY) {
        try {
          const grecaptcha = (window as any).grecaptcha;
          if (grecaptcha && grecaptcha.ready && grecaptcha.execute) {
            recaptchaToken = await new Promise<string>((resolve, reject) => {
              grecaptcha.ready(() => {
                grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'request_password_reset' }).then(resolve).catch(reject);
              });
            });
          } else {
            throw new Error('reCAPTCHA not loaded');
          }
        } catch (e) {
          console.warn('reCAPTCHA execution failed', e);
          toast({ title: 'Verification failed', description: 'Please try again in a moment.', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      // Call server-side endpoint that applies rate-limits and recaptcha verification
      const resp = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, recaptchaToken, referrer: localStorage.getItem('auth_referrer') || (location.state as any)?.from?.pathname || location.pathname || '/' }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        if (resp.status === 404) {
          toast({ title: 'User not registered', description: 'No account found with this email. Please sign up.', variant: 'destructive' });
          setMode('signup');
        } else {
          toast({ title: 'Request failed', description: json?.error || 'Unable to send reset email', variant: 'destructive' });
        }
      } else {
        toast({ title: 'Reset email requested', description: json?.message || 'If an account exists, a reset link will be sent.' });
        setMode('login');
      }
    } catch (err: any) {
      console.error('request reset error', err);
      toast({ title: 'Request failed', description: err?.message || 'Unable to send reset email', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/50">
        <div className="flex flex-col items-center mb-8">
          <img
            src={nexusLogo}
            alt="Nexus Ventures Logo"
            className="h-16 w-auto object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create an account' : 'Reset your password'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Sign up to create a new account. You will receive a verification email - you must verify before signing in.' : 'Enter the email address associated with your account and we\'ll send a password reset link.'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleSubmit : mode === 'signup' ? handleSignup : handleReset} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full name</Label>
              <Input id="signup-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required aria-required="true" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              value={mode === 'reset' ? resetEmail : email} 
              onChange={(e) => mode === 'reset' ? setResetEmail(e.target.value) : setEmail(e.target.value)} 
              placeholder="you@example.com"
              required 
              autoComplete="email"
            />
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password-confirm">Confirm</Label>
                <Input id="signup-password-confirm" name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required autoComplete="new-password" />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
                autoComplete="current-password"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center space-x-2 cursor-pointer">
                <input 
                  id="remember"
                  name="remember"
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button type="button" onClick={() => setMode('reset')} className="text-sm text-primary hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>{mode === 'login' ? 'Signing in…' : mode === 'signup' ? 'Creating…' : 'Sending…'}</>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              <span>Don't have an account? </span>
              <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">Sign up</button>
            </>
          ) : mode === 'signup' ? (
            <>
              <span>Already have an account? </span>
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-medium">Sign in</button>
            </>
          ) : (
            <>
              <span>Remember your password? </span>
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-medium">Sign in</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;
