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
  createdAt: string;
};

export default function MyTicketsPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
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

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-shop-fg">My repair tickets</h1>
          <Link
            href="/repair"
            className="px-4 py-2 bg-shop-accent text-shop-bg font-medium rounded-lg hover:opacity-90"
          >
            New repair
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-shop-card rounded-xl border border-shop-border">
            <p className="text-shop-muted mb-4">No repair tickets yet.</p>
            <Link href="/repair" className="inline-block px-6 py-3 bg-shop-accent text-shop-bg font-medium rounded-lg hover:opacity-90">
              Book a repair
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/repair/tickets/${t.id}`}
                  className="block p-4 bg-shop-card border border-shop-border rounded-xl hover:border-shop-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-shop-fg capitalize">
                      {t.deviceType || 'Device'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-shop-muted line-clamp-1">{t.issueSummary || 'No description'}</p>
                  <p className="text-xs text-shop-muted mt-2">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
