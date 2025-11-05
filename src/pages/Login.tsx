import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
          <a href="#" className="text-primary hover:underline font-medium">
            Contact admin
          </a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
