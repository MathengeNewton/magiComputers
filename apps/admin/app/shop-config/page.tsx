'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '../components/AdminNav';

type HomepageConfig = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImageMediaId?: string | null;
  heroImageUrl?: string | null;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
};

export default function ShopConfigPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [uploadingHomepageImage, setUploadingHomepageImage] = useState(false);
  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>({
    heroEyebrow: 'MagiComputers',
    heroTitle: 'Electronics and repairs done right.',
    heroDescription:
      'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
    heroImageMediaId: '',
    heroImageUrl: '',
    primaryButtonLabel: 'Shop now',
    primaryButtonHref: '/shop',
    secondaryButtonLabel: 'Book repair',
    secondaryButtonHref: '/repair',
  });

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchHomepageConfig = async () => {
    const headers = authHeaders();
    if (!headers) return;
    const res = await fetch(`${apiUrl}/storefront-config`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    setHomepageConfig({
      heroEyebrow: data.heroEyebrow || 'MagiComputers',
      heroTitle: data.heroTitle || 'Electronics and repairs done right.',
      heroDescription:
        data.heroDescription ||
        'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
      heroImageMediaId: data.heroImageMediaId || '',
      heroImageUrl: data.heroImageUrl || '',
      primaryButtonLabel: data.primaryButtonLabel || 'Shop now',
      primaryButtonHref: data.primaryButtonHref || '/shop',
      secondaryButtonLabel: data.secondaryButtonLabel || 'Book repair',
      secondaryButtonHref: data.secondaryButtonHref || '/repair',
    });
  };

  useEffect(() => {
    const headers = authHeaders();
    if (!headers) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        await fetchHomepageConfig();
      } catch {
        setError('Failed to load shop config');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleSaveHomepage = async () => {
    const headers = authHeaders();
    if (!headers) return;
    setSavingHomepage(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${apiUrl}/storefront-config`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroEyebrow: homepageConfig.heroEyebrow,
          heroTitle: homepageConfig.heroTitle,
          heroDescription: homepageConfig.heroDescription,
          heroImageMediaId: homepageConfig.heroImageMediaId || null,
          primaryButtonLabel: homepageConfig.primaryButtonLabel,
          primaryButtonHref: homepageConfig.primaryButtonHref,
          secondaryButtonLabel: homepageConfig.secondaryButtonLabel,
          secondaryButtonHref: homepageConfig.secondaryButtonHref,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save homepage config');
      }
      const data = await res.json();
      setHomepageConfig((prev) => ({
        ...prev,
        heroImageMediaId: data.heroImageMediaId || '',
        heroImageUrl: data.heroImageUrl || '',
      }));
      setSuccess('Homepage section saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save homepage config');
    } finally {
      setSavingHomepage(false);
    }
  };

  const handleUploadHomepageImage = async (file: File) => {
    const headers = authHeaders();
    if (!headers) return;
    setUploadingHomepageImage(true);
    setError('');
    setSuccess('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${apiUrl}/media/upload`, { method: 'POST', headers, body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to upload homepage image');
      }
      const data = await res.json();
      setHomepageConfig((prev) => ({
        ...prev,
        heroImageMediaId: data.mediaId || '',
        heroImageUrl: data.url || '',
      }));
      setSuccess('Image uploaded. Save homepage section to publish this change.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload homepage image');
    } finally {
      setUploadingHomepageImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading shop config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <AdminNav title="MagiComputers · Shop Config" backHref="/dashboard" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            {success}
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Homepage hero section</h2>
          </div>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eyebrow</label>
                <input
                  type="text"
                  value={homepageConfig.heroEyebrow}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, heroEyebrow: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hero title</label>
                <input
                  type="text"
                  value={homepageConfig.heroTitle}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero description</label>
              <textarea
                value={homepageConfig.heroDescription}
                onChange={(e) => setHomepageConfig((prev) => ({ ...prev, heroDescription: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero image</label>
              <input
                id="homepage-hero-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  await handleUploadHomepageImage(file);
                }}
              />
              <div className="flex items-center gap-3">
                <label
                  htmlFor="homepage-hero-upload"
                  className={`px-4 py-2 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 ${uploadingHomepageImage ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {uploadingHomepageImage ? 'Uploading...' : 'Upload image'}
                </label>
                {homepageConfig.heroImageUrl && (
                  <button
                    type="button"
                    onClick={() => setHomepageConfig((prev) => ({ ...prev, heroImageMediaId: '', heroImageUrl: '' }))}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove image
                  </button>
                )}
              </div>
              {homepageConfig.heroImageUrl && (
                <img
                  src={homepageConfig.heroImageUrl}
                  alt="Homepage hero preview"
                  className="mt-3 w-full max-w-sm h-40 object-cover rounded-xl border border-gray-200"
                />
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Primary button label</label>
                <input
                  type="text"
                  value={homepageConfig.primaryButtonLabel}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, primaryButtonLabel: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Primary button link</label>
                <input
                  type="text"
                  value={homepageConfig.primaryButtonHref}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, primaryButtonHref: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary button label</label>
                <input
                  type="text"
                  value={homepageConfig.secondaryButtonLabel}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, secondaryButtonLabel: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary button link</label>
                <input
                  type="text"
                  value={homepageConfig.secondaryButtonHref}
                  onChange={(e) => setHomepageConfig((prev) => ({ ...prev, secondaryButtonHref: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveHomepage}
                disabled={savingHomepage}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {savingHomepage ? 'Saving…' : 'Save homepage section'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
