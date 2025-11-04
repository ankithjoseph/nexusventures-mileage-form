import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // simple client-side validation
    let ok = true;
    setEmailError(null);
    setPasswordError(null);
    const emailRe = /^\S+@\S+\.\S+$/;
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
    }
    if (!ok) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in');
      navigate('/');
    } catch (err: any) {
      console.error('Login failed', err);
      const msg = err?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card border rounded-md shadow">
        <h2 className="text-xl font-semibold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-muted-foreground mb-1">Email</label>
          <input
            type="email"
            className="w-full mb-3 px-3 py-2 border rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          {emailError && <p className="text-sm text-red-600 mb-2">{emailError}</p>}

          <label className="block text-sm text-muted-foreground mb-1">Password</label>
          <input
            type="password"
            className="w-full mb-4 px-3 py-2 border rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {passwordError && <p className="text-sm text-red-600 mb-2">{passwordError}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || loading}>
              {submitting || loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <Link to="/reset-password" className="text-primary hover:underline">Forgot password?</Link>
            <Link to="/signup" className="text-primary hover:underline">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
