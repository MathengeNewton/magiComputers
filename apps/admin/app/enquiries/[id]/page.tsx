'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '../../components/AdminNav';

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

type Enquiry = {
  id: string;
  type: string;
  status: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  deviceType?: string | null;
  issueSummary?: string | null;
  internalNote?: string | null;
  createdAt: string;
  updatedAt: string;
  ticketMessages?: TicketMessage[];
  ticketAttachments?: TicketAttachment[];
};

const STATUS_OPTIONS = ['new', 'contacted', 'quoted', 'complete', 'cancelled'] as const;

export default function EnquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [reply, setReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchEnquiry = async () => {
    const headers = authHeaders();
    if (!headers) {
      router.push('/login');
      return;
    }
    const res = await fetch(`${apiUrl}/enquiries/${id}`, { headers });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setEnquiry(data);
      setStatus(data.status ?? 'new');
      setInternalNote(data.internalNote ?? '');
    } else {
      setEnquiry(null);
    }
  };

  useEffect(() => {
    fetchEnquiry().finally(() => setLoading(false));
  }, [id, apiUrl]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry?.id || !authHeaders()) return;
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/enquiries/${id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, internalNote: internalNote || undefined }),
      });
      if (res.ok) await fetchEnquiry();
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !authHeaders()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${apiUrl}/enquiries/${id}/reply`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (res.ok) {
        setReply('');
        await fetchEnquiry();
      }
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-600 border-t-transparent" />
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminNav title="Enquiry not found" backHref="/enquiries" />
        <main className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-slate-600 mb-4">Enquiry not found.</p>
          <Link href="/enquiries" className="text-blue-600 hover:underline">Back to enquiries</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav title="Enquiry" backHref="/enquiries" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{enquiry.name}</h1>
                <p className="text-sm text-slate-500 mt-1">{new Date(enquiry.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${enquiry.type === 'repair' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                {enquiry.type}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Phone</p>
                <p className="text-slate-900">{enquiry.phone}</p>
              </div>
              {enquiry.email && (
                <div>
                  <p className="text-slate-500 font-medium">Email</p>
                  <p className="text-slate-900">{enquiry.email}</p>
                </div>
              )}
              {enquiry.type === 'repair' && enquiry.deviceType && (
                <div>
                  <p className="text-slate-500 font-medium">Device</p>
                  <p className="text-slate-900 capitalize">{enquiry.deviceType}</p>
                </div>
              )}
            </div>

            {(enquiry.issueSummary || enquiry.message) && (
              <div>
                <p className="text-slate-500 font-medium mb-1">{enquiry.type === 'repair' ? 'Issue description' : 'Message'}</p>
                <div className="p-4 bg-slate-50 rounded-lg text-slate-800 whitespace-pre-wrap">
                  {enquiry.issueSummary || enquiry.message}
                </div>
              </div>
            )}

            {enquiry.type === 'repair' && enquiry.ticketAttachments && enquiry.ticketAttachments.length > 0 && (
              <div>
                <p className="text-slate-500 font-medium mb-2">Attachments</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {enquiry.ticketAttachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden bg-slate-100 border border-slate-200 aspect-square"
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

            {enquiry.ticketMessages && enquiry.ticketMessages.length > 0 && (
              <div>
                <p className="text-slate-500 font-medium mb-2">Chat</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {enquiry.ticketMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg text-sm ${
                        m.senderType === 'staff' ? 'bg-blue-50 text-slate-800 ml-4' : 'bg-slate-100 text-slate-800 mr-4'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                        {m.senderType === 'staff' ? ' · Staff' : ' · Customer'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enquiry.type === 'repair' && (
              <form onSubmit={handleReply} className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Reply to customer</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !reply.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label htmlFor="enquiry-status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  id="enquiry-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="enquiry-note" className="block text-sm font-medium text-slate-700 mb-1">Internal note</label>
                <textarea
                  id="enquiry-note"
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Staff-only notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6">
          <Link href="/enquiries" className="text-blue-600 hover:underline text-sm">Back to enquiries</Link>
        </p>
      </main>
    </div>
  );
}
