'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ShopHeader from '../components/ShopHeader';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/repair';
  const { login, isAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    router.replace(returnUrl);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Please enter email and password', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast('Logged in successfully', 'success');
      router.push(returnUrl);
    } catch (err) {
      toast((err as Error).message || 'Login failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
        <h1 className="text-2xl font-bold text-shop-fg mb-2">Log in</h1>
        <p className="text-shop-muted mb-8">Use your account to book repairs and view tickets.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-shop-fg mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-shop-fg mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-shop-accent hover:underline">Forgot password?</Link>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-shop-muted">
          Don&apos;t have an account? <Link href="/signup" className="text-shop-accent hover:underline">Sign up</Link>
        </p>
      </main>
    </div>
  );
}
