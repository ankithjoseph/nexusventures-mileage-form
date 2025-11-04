import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const LoginModal: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in');
    } catch (err: any) {
      console.error('Login error', err);
      toast.error(err?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Login</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-sm text-muted-foreground">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />

          <label className="text-sm text-muted-foreground">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setEmail(''); setPassword(''); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>{submitting || loading ? 'Signing in...' : 'Sign in'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
