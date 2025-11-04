import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import pb from '@/lib/pocketbase';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !passwordConfirm) {
      toast.error('Please complete all fields');
      return;
    }
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await pb.collection('users').create({ email, password, passwordConfirm, name });
      toast.success('Account created, please login');
      navigate('/login');
    } catch (err: any) {
      console.error('Signup error', err);
      toast.error(err?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card border rounded-md shadow">
        <h2 className="text-xl font-semibold mb-4">Create account</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-muted-foreground mb-1">Name</label>
          <input className="w-full mb-2 px-3 py-2 border rounded" value={name} onChange={e => setName(e.target.value)} />

          <label className="block text-sm text-muted-foreground mb-1">Email</label>
          <input type="email" className="w-full mb-2 px-3 py-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />

          <label className="block text-sm text-muted-foreground mb-1">Password</label>
          <input type="password" className="w-full mb-2 px-3 py-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} />

          <label className="block text-sm text-muted-foreground mb-1">Confirm Password</label>
          <input type="password" className="w-full mb-4 px-3 py-2 border rounded" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
