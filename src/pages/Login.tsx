import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await login(email, password, remember);
      toast({ title: 'Signed in', description: 'Redirecting…' });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error', err);
      toast({ title: 'Sign in failed', description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign in to Nexus Ventures</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center space-x-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="text-sm">Remember me</span>
            </label>
            <a className="text-sm text-muted-foreground hover:underline" href="#">Forgot?</a>
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <span>Don&apos;t have an account? </span>
          <a href="#" className="text-primary underline">Contact admin</a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
