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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // client-side validation
    setEmailError(null);
    setPasswordError(null);
    const emailRe = /^\S+@\S+\.\S+$/;
    let ok = true;
    if (!email) {
      setEmailError('Email is required');
      ok = false;
    } else if (!emailRe.test(email)) {
      setEmailError('Please enter a valid email address');
      ok = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      ok = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      ok = false;
    }
    if (password !== passwordConfirm) {
      setPasswordError('Passwords do not match');
      ok = false;
    }
    if (!ok) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await pb.collection('users').create({ email, password, passwordConfirm, name });
      console.info('Signup success', res);
      toast.success('Account created, please login');
      navigate('/login');
    } catch (err: any) {
      // PocketBase client throws a ClientResponseError with details in `data` or `response`
      console.error('Signup error', err);
      // try to extract a helpful message
      const serverMsg = err?.data ?? err?.response ?? null;
      if (serverMsg) {
        // show concise message if available
        const msg = serverMsg?.message || serverMsg?.error || JSON.stringify(serverMsg);
        toast.error(msg?.toString?.() || 'Signup failed');
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error('Signup failed — check PocketBase server and CORS settings');
      }
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
          {emailError && <p className="text-sm text-red-600 mb-2">{emailError}</p>}

          <label className="block text-sm text-muted-foreground mb-1">Password</label>
          <input type="password" className="w-full mb-2 px-3 py-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} />

          <label className="block text-sm text-muted-foreground mb-1">Confirm Password</label>
          <input type="password" className="w-full mb-4 px-3 py-2 border rounded" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
          {passwordError && <p className="text-sm text-red-600 mb-2">{passwordError}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
