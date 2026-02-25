'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ShopHeader from '../components/ShopHeader';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(() => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001', []);
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast('Please enter your email', 'error');
      return;
    }
    setSubmitting(true);
    setResetLink(null);
    try {
      const res = await fetch(`${apiUrl}/store/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setSent(true);
      if (data.resetLink) setResetLink(data.resetLink);
      toast(data.message || 'If an account exists, you will receive a reset link.', 'success');
    } catch {
      toast('Something went wrong. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
        <h1 className="text-2xl font-bold text-shop-fg mb-2">Reset password</h1>
        <p className="text-shop-muted mb-8">Enter your email and we&apos;ll send you a link to reset your password.</p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-shop-fg mb-1">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-shop-fg">Check your email for a reset link. In development, the link may appear below:</p>
            {resetLink && (
              <p className="text-sm break-all text-shop-accent">
                <Link href={resetLink} className="hover:underline">{resetLink}</Link>
              </p>
            )}
            <Link href="/login" className="block text-center py-3 text-shop-accent hover:underline">Back to log in</Link>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-shop-muted">
          <Link href="/login" className="text-shop-accent hover:underline">Back to log in</Link>
        </p>
      </main>
    </div>
  );
}
