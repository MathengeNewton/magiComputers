'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShopHeader from '../../components/ShopHeader';
import { useCustomerAuth } from '../../context/CustomerAuthContext';

type Ticket = {
  id: string;
  status: string;
  deviceType: string | null;
  issueSummary: string | null;
  message: string | null;
  name: string;
  phone: string;
  createdAt: string;
};

export default function MyTicketsPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000', []);
  const { isAuthenticated, loading: authLoading, accessToken } = useCustomerAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?returnUrl=/repair/tickets');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/store/me/tickets`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 401) {
          router.replace('/login?returnUrl=/repair/tickets');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken, apiUrl, router]);

  if (authLoading || (!isAuthenticated && !loading)) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
        </main>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === 'complete') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (s === 'new') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-shop-fg">My repair tickets</h1>
          <Link
            href="/repair"
            className="px-4 py-2.5 bg-shop-accent text-shop-bg font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            New repair
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20 bg-shop-card rounded-2xl border border-shop-border">
            <p className="text-shop-muted mb-6">No repair tickets yet.</p>
            <Link href="/repair" className="inline-block px-6 py-3 bg-shop-accent text-shop-bg font-medium rounded-lg hover:opacity-90 transition-opacity">
              Book a repair
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/repair/tickets/${t.id}`}
                  className="block p-5 sm:p-6 bg-shop-card border border-shop-border rounded-xl hover:border-shop-accent/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-shop-fg capitalize">
                          {t.deviceType || 'Device'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(t.status)}`}>
                          {t.status}
                        </span>
                        <span className="text-xs text-shop-muted">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-shop-muted line-clamp-2 mb-2">
                        {t.issueSummary || t.message || 'No description'}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-shop-muted">
                        <span>{t.phone || '—'}</span>
                        <span>{t.name || '—'}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-shop-accent group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 text-sm font-medium">
                      View details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
