import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import pb from '@/lib/pocketbase';
import { LogIn } from 'lucide-react';
import nexusLogo from '@/assets/nexus-ventures-logo.png';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border/50">
        <div className="flex flex-col items-center mb-8">
          <img
            src={nexusLogo}
            alt="Nexus Ventures Logo"
            className="h-16 w-auto object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <a className="text-sm text-primary hover:underline" href="#">
              Forgot password?
            </a>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>Signing in…</>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <span>Don&apos;t have an account? </span>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-primary hover:underline font-medium">Sign up</button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create an account</DialogTitle>
                <DialogDescription>Sign up to create a new account. You will receive a verification email — you must verify before signing in.</DialogDescription>
              </DialogHeader>

              <SignupForm />

              <DialogFooter />
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
};

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (password !== passwordConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // create the user record in PocketBase
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
      });

      // request verification email
      let verificationSent = false;
      try {
        // Try common SDK signatures: string email first, then object { email }
        // @ts-ignore
        await pb.collection('users').requestVerification(email);
        verificationSent = true;
      } catch (reqErr1) {
        try {
          // @ts-ignore
          await pb.collection('users').requestVerification({ email });
          verificationSent = true;
        } catch (reqErr2) {
          console.warn('requestVerification failed (both signatures)', reqErr1, reqErr2);
        }
      }

      if (verificationSent) {
        toast({ title: 'Verification sent', description: 'Check your email for a verification link before signing in.' });
      } else {
        // Inform the user and surface likely server-side misconfiguration (SMTP)
        toast({
          title: 'Verification not sent',
          description: 'We were unable to send a verification email. Please contact the administrator or check server SMTP configuration.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Signup error', err);
      toast({ title: 'Signup failed', description: err?.message || 'Unable to create account', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full name</Label>
        <Input id="signup-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
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

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </div>
    </form>
  );
};

export default Login;
