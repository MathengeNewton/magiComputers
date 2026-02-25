'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNav from '../components/AdminNav';
import DataTable, { DataTableColumn } from '../components/DataTable';

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
  createdAt: string;
};

export default function EnquiriesPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ items: Enquiry[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | null>(null);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchEnquiries = async () => {
    setError('');
    const headers = authHeaders();
    if (!headers) {
      router.push('/login');
      return;
    }
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`${apiUrl}/enquiries?${params.toString()}`, { headers });
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      router.push('/login');
      return;
    }
    if (!res.ok) {
      setError('Failed to load enquiries');
      return;
    }
    const json = await res.json();
    setData({
      items: json.items ?? [],
      pagination: json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchEnquiries();
      } catch {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, typeFilter, statusFilter]);

  const enquiries = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

  const rows = useMemo(
    () =>
      enquiries.map((e) => ({
        ...e,
        _snippet: (e.issueSummary || e.message || '').slice(0, 50) + ((e.issueSummary || e.message || '').length > 50 ? '…' : ''),
        _createdAt: new Date(e.createdAt).toLocaleString(),
      })),
    [enquiries],
  );

  const columns: DataTableColumn<Enquiry & { _snippet: string; _createdAt: string }>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (r) => r.name },
    { key: 'phone', label: 'Phone', sortable: true, render: (r) => r.phone },
    { key: 'type', label: 'Type', sortable: true, render: (r) => <span className={`px-2 py-1 rounded text-xs font-medium ${r.type === 'repair' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{r.type}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <span className={`px-2 py-1 rounded text-xs font-medium ${r.status === 'complete' ? 'bg-green-100 text-green-800' : r.status === 'cancelled' ? 'bg-red-100 text-red-800' : r.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>{r.status}</span> },
    { key: '_snippet', label: 'Message', sortable: false, render: (r) => <span className="text-slate-600 max-w-[200px] truncate block" title={r.message}>{r._snippet}</span> },
    { key: '_createdAt', label: 'Date', sortable: true, render: (r) => r._createdAt },
    { key: 'actions', label: 'Actions', sortable: false, render: (r) => <Link href={`/enquiries/${r.id}`} className="text-blue-600 hover:underline text-sm font-medium">View</Link> },
  ];

  const filters = (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={typeFilter}
        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
      >
        <option value="">All types</option>
        <option value="contact">Contact</option>
        <option value="repair">Repair</option>
      </select>
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
      >
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="quoted">Quoted</option>
        <option value="complete">Complete</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <AdminNav title="MagiComputers · Enquiries" backHref="/dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900">Enquiries & Repairs</h1>
          {filters}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(r) => r.id}
            emptyMessage="No enquiries yet. Contact and repair requests from the shop will appear here."
            title="Enquiries"
            pagination={
              pagination.totalPages > 1
                ? {
                    pageSize: pagination.limit,
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                    total: pagination.total,
                    onPageChange: (p: number) => setPage(p),
                  }
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
