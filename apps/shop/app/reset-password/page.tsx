'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ShopHeader from '../components/ShopHeader';
import { useToast } from '../context/ToastContext';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast('Missing reset token', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/store/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Reset failed');
      }
      setDone(true);
      toast('Password reset successfully. You can log in now.', 'success');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast((err as Error).message || 'Reset failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
          <h1 className="text-2xl font-bold text-shop-fg mb-4">Invalid reset link</h1>
          <p className="text-shop-muted mb-6">This link is missing a token. Request a new reset link from the forgot password page.</p>
          <Link href="/forgot-password" className="text-shop-accent hover:underline">Forgot password</Link>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
          <h1 className="text-2xl font-bold text-shop-fg mb-4">Password reset</h1>
          <p className="text-shop-muted">Redirecting you to log in...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
        <h1 className="text-2xl font-bold text-shop-fg mb-2">Set new password</h1>
        <p className="text-shop-muted mb-8">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-shop-fg mb-1">New password</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-shop-fg mb-1">Confirm password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-shop-muted">
          <Link href="/login" className="text-shop-accent hover:underline">Back to log in</Link>
        </p>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-shop-accent border-t-transparent" /></main>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
