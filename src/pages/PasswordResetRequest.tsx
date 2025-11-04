import { useState } from 'react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbase';
import { toast } from 'sonner';

const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await pb.collection('users').requestPasswordReset(email);
      toast.success('Password reset requested. Check your email.');
    } catch (err: any) {
      console.error('Password reset request error', err);
      toast.error(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 bg-card border rounded-md shadow">
        <h2 className="text-xl font-semibold mb-4">Reset password</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-muted-foreground mb-1">Email</label>
          <input type="email" className="w-full mb-4 px-3 py-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset email'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetRequest;
