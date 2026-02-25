'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../components/ShopHeader';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useToast } from '../context/ToastContext';

export default function SignupPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    router.replace('/repair');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      toast('Please fill in email, password, and name', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, name: name.trim(), phone: phone.trim() || undefined });
      toast('Account created. Welcome!', 'success');
      router.push('/repair');
    } catch (err) {
      toast((err as Error).message || 'Sign up failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-md mx-auto px-4 py-16 w-full">
        <h1 className="text-2xl font-bold text-shop-fg mb-2">Create account</h1>
        <p className="text-shop-muted mb-8">Sign up to book repairs and track your tickets.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-shop-fg mb-1">Name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-shop-fg mb-1">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-shop-fg mb-1">Phone (optional)</label>
            <input
              id="signup-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 123 456"
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-shop-fg mb-1">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-shop-muted">
          Already have an account? <Link href="/login" className="text-shop-accent hover:underline">Log in</Link>
        </p>
      </main>
    </div>
  );
}
