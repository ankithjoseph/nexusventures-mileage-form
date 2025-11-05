import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import pb from '@/lib/pocketbase';
import { useNavigate } from 'react-router-dom';

const RequestPasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      // first check if a user with this email exists
      const list = await pb.collection('users').getList(1, 1, { filter: `email = "${email}"` });
      if (!list || list.total === 0) {
        toast({ title: 'No account found', description: 'No account is registered with that email. Please sign up first.' });
        // redirect to login where user can sign up
        navigate('/login');
        return;
      }

      await pb.collection('users').requestPasswordReset(email);
      toast({ title: 'Reset email sent', description: 'Check your inbox for a link to reset your password.' });
      navigate('/login');
    } catch (err: any) {
      console.error('request reset error', err);
      toast({ title: 'Request failed', description: err?.message || 'Unable to send reset email', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-lg font-semibold mb-2">Reset your password</h2>
        <p className="text-sm text-muted-foreground mb-4">Enter the email address associated with your account and we'll send a password reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rpr-email">Email</Label>
            <Input id="rpr-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RequestPasswordReset;
