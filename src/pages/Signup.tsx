import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbase';

const SignupPage: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	// Disable browser autofill for the standalone signup page.
	const formAutoComplete = 'off';
	const inputAutoComplete = 'off';

	// Persist an intended post-verification redirect so the VerifyEmail page
	// can send the user back after they confirm their email.
	useEffect(() => {
		try {
			const params = new URLSearchParams(location.search);
			const returnTo = params.get('returnTo') || (location.state as any)?.from;
			if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
				localStorage.setItem('post_verify_redirect', JSON.stringify({ path: returnTo, ts: Date.now() }));
			}
		} catch (e) {
			// ignore localStorage or parsing errors
		}
	}, [location]);

	const handleSignup = async (e?: React.FormEvent) => {
		e?.preventDefault();

		// Ensure name is provided
		if (!name || !name.trim()) {
			toast({ title: 'Name required', description: 'Please enter your full name', variant: 'destructive' });
			return;
		}
		if (password !== passwordConfirm) {
			toast({ title: 'Passwords do not match', variant: 'destructive' });
			return;
		}

		// Basic client-side email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' });
			return;
		}
		setLoading(true);
		try {
			await pb.collection('users').create({ email, password, passwordConfirm, name });

			// PocketBase client may or may not expose `requestVerification` on the
			// client SDK depending on versions and config. Call it only if present
			// to avoid runtime/type errors.
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
			// keep navigating to login (user must verify before signing in). The
			// post-verification redirect is stored in localStorage by the effect
			// above and will be used by the VerifyEmail page.
			navigate('/login');
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
				<h1 className="text-2xl font-bold mb-4">Create an account</h1>
				<p className="text-sm text-muted-foreground mb-6">Sign up to create a new account. You will receive a verification email — you must verify before signing in.</p>

				<form onSubmit={handleSignup} className="space-y-4" autoComplete={formAutoComplete}>
					<div className="space-y-2">
						<Label htmlFor="signup-name">Full name</Label>
						<Input id="signup-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required aria-required="true" autoComplete={inputAutoComplete} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="signup-email">Email</Label>
						<Input id="signup-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete={inputAutoComplete} />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="signup-password">Password</Label>
							<Input id="signup-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={inputAutoComplete} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="signup-password-confirm">Confirm</Label>
							<Input id="signup-password-confirm" name="passwordConfirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required autoComplete={inputAutoComplete} />
						</div>
					</div>

					<div className="flex justify-end">
						<Button type="submit" disabled={loading} size="sm">
							{loading ? 'Creating…' : 'Create account'}
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
};

export default SignupPage;
