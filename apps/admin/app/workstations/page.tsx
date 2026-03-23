'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { useConfirm } from '../components/ConfirmContext';

type Product = { id: string; title: string; slug: string };
type Workstation = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  coverMediaId?: string | null;
  coverMedia?: { id: string; url: string } | null;
  status: 'draft' | 'published';
  sortOrder: number;
  products: Array<{ productId: string; order: number; isPrimary: boolean; product: Product }>;
  _count?: { products: number };
};

const defaultForm = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  coverMediaId: '',
  coverImageUrl: '',
  status: 'draft' as 'draft' | 'published',
  sortOrder: 0,
  products: [] as Array<{ productId: string; order: number; isPrimary: boolean }>,
};

export default function WorkstationsPage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [items, setItems] = useState<Workstation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkProductId, setLinkProductId] = useState('');
  const [form, setForm] = useState(defaultForm);
  const { confirm } = useConfirm();

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    const headers = authHeaders();
    if (!headers) return;

    setLoading(true);
    setError('');
    try {
      const [workstationsRes, productsRes] = await Promise.all([
        fetch(`${apiUrl}/workstations`, { headers }),
        fetch(`${apiUrl}/products?limit=100`, { headers }),
      ]);

      if (!workstationsRes.ok) throw new Error('Failed to load workstations');
      if (!productsRes.ok) throw new Error('Failed to load products');

      const workstationsData = await workstationsRes.json();
      const productsData = await productsRes.json();

      setItems(Array.isArray(workstationsData) ? workstationsData : []);
      setProducts(productsData.products || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setLinkProductId('');
    setShowForm(true);
  };

  const openEdit = (item: Workstation) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      summary: item.summary || '',
      description: item.description || '',
      coverMediaId: item.coverMediaId || '',
      coverImageUrl: item.coverMedia?.url || '',
      status: item.status,
      sortOrder: item.sortOrder,
      products: item.products.map((entry, index) => ({
        productId: entry.productId,
        order: entry.order ?? index,
        isPrimary: !!entry.isPrimary,
      })),
    });
    setLinkProductId('');
    setShowForm(true);
  };

  const save = async () => {
    const headers = authHeaders();
    if (!headers) return;
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Title and slug are required');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      summary: form.summary.trim() || undefined,
      description: form.description.trim() || undefined,
      coverMediaId: form.coverMediaId.trim() || undefined,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
      products: form.products.map((entry, index) => ({
        productId: entry.productId,
        order: Number(entry.order) || index,
        isPrimary: entry.isPrimary,
      })),
    };
    try {
      const url = editingId ? `${apiUrl}/workstations/${editingId}` : `${apiUrl}/workstations`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save workstation');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save workstation');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Delete workstation',
      message: 'This removes the setup and all linked products from it.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;

    const headers = authHeaders();
    if (!headers) return;
    const res = await fetch(`${apiUrl}/workstations/${id}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Failed to delete workstation');
      return;
    }
    await fetchData();
  };

  const uploadCoverImage = async (file: File) => {
    const headers = authHeaders();
    if (!headers) return;
    setImageUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiUrl}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload cover image');
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        coverMediaId: data.mediaId || '',
        coverImageUrl: data.url || '',
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload cover image');
    } finally {
      setImageUploading(false);
    }
  };

  const linkedProducts = form.products.map((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    return { ...entry, product };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav title="MagiComputers · Workstations" backHref="/dashboard" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workstations</h1>
            <p className="text-sm text-slate-500 mt-1">Manage client setup showcases and linked sellable products.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Add workstation
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            No workstation setups yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
                    <p className="text-sm text-slate-500">/{item.slug}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.summary || 'No summary'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-500">{item._count?.products ?? item.products.length} product links</span>
                    <button onClick={() => openEdit(item)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                    <button onClick={() => remove(item.id)} className="text-red-600 text-sm font-medium hover:underline">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit workstation' : 'Create workstation'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cover image</label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="workstation-cover-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        await uploadCoverImage(file);
                      }}
                    />
                    <label
                      htmlFor="workstation-cover-upload"
                      className={`inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer hover:bg-slate-50 ${imageUploading ? 'opacity-60 pointer-events-none' : ''}`}
                    >
                      {imageUploading ? 'Uploading...' : 'Upload cover image'}
                    </label>
                    {form.coverMediaId && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, coverMediaId: '', coverImageUrl: '' }))}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {form.coverImageUrl && (
                    <div className="mt-3">
                      <img
                        src={form.coverImageUrl}
                        alt="Workstation cover preview"
                        className="w-full max-w-xs h-32 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sort order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-slate-900">Linked products</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={linkProductId}
                      onChange={(e) => setLinkProductId(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select product</option>
                      {products
                        .filter((product) => !form.products.some((entry) => entry.productId === product.id))
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.title}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!linkProductId) return;
                        setForm((prev) => ({
                          ...prev,
                          products: [
                            ...prev.products,
                            {
                              productId: linkProductId,
                              order: prev.products.length,
                              isPrimary: prev.products.length === 0,
                            },
                          ],
                        }));
                        setLinkProductId('');
                      }}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {linkedProducts.length === 0 ? (
                  <p className="text-sm text-slate-500">No linked products.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedProducts.map((entry, index) => (
                      <div key={entry.productId} className="flex items-center justify-between gap-3 p-2 rounded border border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{entry.product?.title || entry.productId}</p>
                          <p className="text-xs text-slate-500">/{entry.product?.slug || 'unknown'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 flex items-center gap-1">
                            <input
                              type="radio"
                              checked={entry.isPrimary}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  products: prev.products.map((row, i) => ({ ...row, isPrimary: i === index })),
                                }))
                              }
                            />
                            Primary
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                products: prev.products
                                  .filter((_, i) => i !== index)
                                  .map((row, i) => ({ ...row, order: i })),
                              }))
                            }
                            className="text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save workstation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
