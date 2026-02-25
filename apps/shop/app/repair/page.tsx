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

export default function RepairPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, customer, accessToken } = useCustomerAuth();

  const [deviceType, setDeviceType] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?returnUrl=/repair');
      return;
    }
    if (customer?.phone) setPhone(customer.phone);
  }, [authLoading, isAuthenticated, customer?.phone, router]);

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
    const phoneVal = customer?.phone || phone;
    if (!phoneVal?.trim()) {
      toast('Please add your phone number', 'error');
      return;
    }
    if (!accessToken || !customer) {
      toast('Please log in to submit a repair', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const attachmentUrls: { url: string; mimeType: string }[] = [];
      for (const { file, mimeType } of files) {
        const form = new FormData();
        form.append('file', file);
        const up = await fetch(`${apiUrl}/store/me/repair/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        });
        if (up.ok) {
          const data = await up.json();
          attachmentUrls.push({ url: data.url, mimeType });
        }
      }
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
          phone: customer.phone || phone || undefined,
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
    } catch (err) {
      toast((err as Error).message || 'Failed to submit repair request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />

      <main className="flex-1 max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-shop-fg mb-4">
          Book a repair
        </h1>
        <p className="text-shop-muted mb-10">
          Describe your device and the issue. You can add photos or a short video. We&apos;ll get back to you with a quote and next steps.
        </p>

        <p className="text-sm text-shop-muted mb-6">
          Logged in as <span className="text-shop-fg">{customer?.email}</span>. <Link href="/repair/tickets" className="text-shop-accent hover:underline">View my tickets</Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!customer?.phone && (
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
              />
            </div>
          )}

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
              className="w-full px-4 py-3 bg-shop-card border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent transition-all resize-none"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
            className="w-full px-6 py-3 bg-shop-accent text-shop-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
