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

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Signup fields
  const [name, setName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
    setLoading(true);
    try {
      await pb.collection('users').create({ email, password, passwordConfirm, name });
      try {
        const usersColl: any = pb.collection('users');
        if (usersColl && typeof usersColl.requestVerification === 'function') {
          await usersColl.requestVerification(email);
        } else {
          console.warn('pb.collection("users").requestVerification not available; skipping explicit verification request');
        }
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
            {mode === 'login' ? 'Welcome Back' : 'Create an account'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Sign up to create a new account. You will receive a verification email - you must verify before signing in.'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleSubmit : handleSignup} className="space-y-5">
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
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              required 
              autoComplete="email"
            />
          </div>

          <div className={mode === 'signup' ? "grid grid-cols-2 gap-4" : "space-y-2"}>
            {mode === 'signup' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password-confirm">Confirm</Label>
                  <Input id="signup-password-confirm" name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required autoComplete="new-password" />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

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
              <a className="text-sm text-primary hover:underline" href="/request-password-reset">
                Forgot password?
              </a>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>{mode === 'login' ? 'Signing in…' : 'Creating…'}</>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                {mode === 'login' ? 'Sign In' : 'Create account'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <span>{mode === 'login' ? "Don't have an account? " : "Already have an account? "}</span>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-primary hover:underline font-medium">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
