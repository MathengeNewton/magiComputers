'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ShopHeader from '../../../components/ShopHeader';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';

type TicketMessage = {
  id: string;
  senderType: string;
  body: string;
  createdAt: string;
};

type TicketAttachment = {
  id: string;
  url: string;
  mimeType: string;
};

type Ticket = {
  id: string;
  status: string;
  deviceType: string | null;
  issueSummary: string | null;
  message: string;
  createdAt: string;
  ticketMessages: TicketMessage[];
  ticketAttachments: TicketAttachment[];
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const { isAuthenticated, loading: authLoading, accessToken } = useCustomerAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=/repair/tickets/${id}`);
      return;
    }
  }, [authLoading, isAuthenticated, router, id]);

  const fetchTicket = useCallback(async () => {
    if (!accessToken) return;
    const res = await fetch(`${apiUrl}/store/me/tickets/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) setTicket(await res.json());
    else setTicket(null);
  }, [accessToken, apiUrl, id]);

  useEffect(() => {
    if (!accessToken) return;
    fetchTicket().finally(() => setLoading(false));
  }, [accessToken, fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.ticketMessages?.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !accessToken || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/store/me/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (res.ok) {
        setReply('');
        await fetchTicket();
      }
    } finally {
      setSending(false);
    }
  };

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

  if (loading && !ticket) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-shop-accent border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-shop-bg flex flex-col">
        <ShopHeader />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-shop-fg mb-4">Ticket not found</h1>
          <Link href="/repair/tickets" className="text-shop-accent hover:underline">Back to my tickets</Link>
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
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/repair/tickets" className="text-sm text-shop-accent hover:underline mb-6 inline-block">
          Back to my tickets
        </Link>

        <div className="bg-shop-card border border-shop-border rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h1 className="text-xl font-bold text-shop-fg capitalize">
              {ticket.deviceType || 'Repair'} ticket
            </h1>
            <span className={`px-2 py-1 rounded text-sm font-medium ${statusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-sm text-shop-muted mb-2">
            Opened {new Date(ticket.createdAt).toLocaleString()}
          </p>
          <p className="text-shop-fg whitespace-pre-wrap">{ticket.issueSummary || ticket.message}</p>

          {ticket.ticketAttachments && ticket.ticketAttachments.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-shop-fg mb-2">Photos / video</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ticket.ticketAttachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden bg-shop-bg border border-shop-border aspect-square"
                  >
                    {a.mimeType.startsWith('video/') ? (
                      <video src={a.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-shop-card border border-shop-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 320 }}>
          <h2 className="text-sm font-medium text-shop-fg px-4 py-3 border-b border-shop-border">Chat</h2>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
            {ticket.ticketMessages?.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    m.senderType === 'customer'
                      ? 'bg-shop-accent text-shop-bg'
                      : 'bg-shop-border/50 text-shop-fg'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                    {m.senderType === 'staff' && ' · Staff'}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-4 border-t border-shop-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-shop-bg border border-shop-border rounded-lg text-shop-fg placeholder-shop-muted focus:ring-2 focus:ring-shop-accent focus:border-transparent"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="px-4 py-2 bg-shop-accent text-shop-bg font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
