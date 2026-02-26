'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../components/ShopHeader';
import { useToast } from '../context/ToastContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const DEVICE_TYPES = [
  { value: '', label: 'Select device type' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'phone', label: 'Phone / Smartphone' },
  { value: 'desktop', label: 'Desktop PC' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'other', label: 'Other' },
];

type FilePreview = { file: File; url: string; mimeType: string };

type Step = 'form' | 'success';

export default function RepairPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(
    () => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    [],
  );
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, customer, accessToken, loginByPhone, registerByPhone } = useCustomerAuth();

  const [step, setStep] = useState<Step>('form');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (customer) {
      if (customer.name) setName(customer.name);
      if (customer.phone) setPhone(customer.phone);
    }
  }, [customer]);
  const [deviceType, setDeviceType] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    const newPreviews: FilePreview[] = chosen.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      mimeType: file.type || 'application/octet-stream',
    }));
    setFiles((prev) => [...prev, ...newPreviews].slice(0, 6));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast('Please describe the issue', 'error');
      return;
    }
    const nameVal = (isAuthenticated ? customer?.name : name)?.trim();
    const phoneVal = (isAuthenticated ? customer?.phone : phone) || phone?.trim();

    if (!nameVal) {
      toast('Please enter your name', 'error');
      return;
    }
    if (!phoneVal) {
      toast('Please enter your phone number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const attachmentUrls: { url: string; mimeType: string }[] = [];
      const uploadEndpoint = isAuthenticated
        ? `${apiUrl}/store/me/repair/upload`
        : `${apiUrl}/store/repair/upload?tenantId=${tenantId}`;

      for (const { file, mimeType } of files) {
        const form = new FormData();
        form.append('file', file);
        const up = await fetch(uploadEndpoint, {
          method: 'POST',
          ...(isAuthenticated && accessToken
            ? { headers: { Authorization: `Bearer ${accessToken}` } }
            : {}),
          body: form,
        });
        if (up.ok) {
          const data = await up.json();
          attachmentUrls.push({ url: data.url, mimeType });
        }
      }

      if (isAuthenticated && accessToken && customer) {
        const res = await fetch(`${apiUrl}/store/me/repair`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: message.trim(),
            issueSummary: message.trim(),
            deviceType: deviceType || undefined,
            phone: phoneVal,
            attachmentUrls: attachmentUrls.length ? attachmentUrls : undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to submit repair request');
        }
        const ticket = await res.json();
        toast('Repair request submitted. We\'ll contact you shortly.', 'success');
        router.push(ticket?.id ? `/repair/tickets/${ticket.id}` : '/repair/tickets');
        return;
      }

      const res = await fetch(`${apiUrl}/store/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: nameVal,
          phone: phoneVal,
          message: message.trim(),
          issueSummary: message.trim(),
          deviceType: deviceType || undefined,
          attachmentUrls: attachmentUrls.length ? attachmentUrls : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit repair request');
      }
      const ticket = await res.json();
      setSubmittedTicketId(ticket?.id ?? null);
      setAuthName(nameVal);
      setAuthPhone(phoneVal);
      setStep('success');
    } catch (err) {
      toast((err as Error).message || 'Failed to submit repair request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      if (authTab === 'login') {
        if (!authPhone.trim() || !authPassword) {
          toast('Please enter phone and password', 'error');
          return;
        }
        await loginByPhone(authPhone.trim(), authPassword);
        toast('Logged in successfully', 'success');
        router.push(submittedTicketId ? `/repair/tickets/${submittedTicketId}` : '/repair/tickets');
      } else {
        if (!authName.trim() || !authPhone.trim() || !authPassword) {
          toast('Please fill in name, phone, and password', 'error');
          return;
        }
        await registerByPhone({
          name: authName.trim(),
          phone: authPhone.trim(),
          password: authPassword,
        });
        toast('Account created! Your repair is now linked.', 'success');
        router.push(submittedTicketId ? `/repair/tickets/${submittedTicketId}` : '/repair/tickets');
      }
    } catch (err) {
      toast((err as Error).message || 'Authentication failed', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
        </main>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-shop-fg mb-2">
              Repair request submitted
            </h1>
            <p className="text-shop-muted">
              We&apos;ve received your request and will get back to you shortly with a quote.
            </p>
          </div>

          <div className="max-w-md mx-auto">
          <div className="bg-shop-card border border-shop-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-shop-fg mb-2">Create account to track your repair</h2>
            <p className="text-sm text-shop-muted mb-6">
              We need your name, phone, and a password so you can view status updates and chat with our team.
            </p>

            <div className="flex rounded-lg bg-shop-bg p-1 mb-6">
              <button
                type="button"
                onClick={() => setAuthTab('signup')}
                className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                  authTab === 'signup'
                    ? 'bg-shop-card text-shop-fg shadow'
                    : 'text-shop-muted hover:text-shop-fg'
                }`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                  authTab === 'login'
                    ? 'bg-shop-card text-shop-fg shadow'
                    : 'text-shop-muted hover:text-shop-fg'
                }`}
              >
                Log in
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authTab === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-sm font-medium text-shop-fg mb-1.5">
                    Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-shop-bg border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="auth-phone" className="block text-sm font-medium text-shop-fg mb-1.5">
                  Phone number
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="+254 700 123 456"
                  className="w-full px-4 py-3 bg-shop-bg border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-shop-fg mb-1.5">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={authTab === 'signup' ? 'Min. 6 characters' : ''}
                  minLength={authTab === 'signup' ? 6 : undefined}
                  className="w-full px-4 py-3 bg-shop-bg border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3.5 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authSubmitting
                  ? 'Please wait...'
                  : authTab === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>
          </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-shop-fg mb-3">
            Book a repair
          </h1>
          <p className="text-shop-muted">
            Tell us about your device and the issue. Add photos or a short video to help us assess. You&apos;ll create an account at the end to track your ticket — we only need your name, phone, and a password.
          </p>
        </div>

        {isAuthenticated && (
          <p className="text-sm text-shop-muted mb-6">
            Logged in as <span className="text-shop-fg">{customer?.email}</span>.{' '}
            <Link href="/repair/tickets" className="text-shop-accent hover:underline">View my tickets</Link>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isAuthenticated && (
              <div>
                <label htmlFor="repair-name" className="block text-sm font-medium text-shop-fg mb-2">
                  Your name
                </label>
                <input
                  id="repair-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="repair-phone" className="block text-sm font-medium text-shop-fg mb-2">
                Phone number
              </label>
              <input
                id="repair-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +254 700 123 456"
                className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="repair-device" className="block text-sm font-medium text-shop-fg mb-2">
                Device type
              </label>
              <select
                id="repair-device"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg focus:ring-2 focus:ring-shop-accent focus:border-transparent transition-all"
              >
              {DEVICE_TYPES.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            </div>
          </div>

          <div>
            <label htmlFor="repair-message" className="block text-sm font-medium text-shop-fg mb-2">
              Issue description
            </label>
            <textarea
              id="repair-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the problem (e.g. screen won't turn on, battery not charging, software issue...)"
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-shop-fg mb-2">
              Photos or short video (optional)
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-6 bg-shop-card border-2 border-dashed border-shop-border rounded-xl cursor-pointer hover:border-shop-muted transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <svg className="w-8 h-8 text-shop-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <span className="text-shop-muted">Drop files or click to upload</span>
              </label>
              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                  {files.map((fp, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden bg-shop-card border border-shop-border aspect-square">
                      {fp.mimeType.startsWith('video/') ? (
                        <video src={fp.url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={fp.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3.5 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit repair request'}
          </button>
        </form>

        <p className="mt-8 text-sm text-shop-muted text-center">
          Prefer to chat? <Link href="/contact" className="text-shop-accent hover:underline">Contact us</Link> instead.
        </p>
      </main>
    </div>
  );
}
