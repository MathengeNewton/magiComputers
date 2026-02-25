'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNav from '../../components/AdminNav';
import PostsViewTabs from '../PostsViewTabs';

type Post = {
  id: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  destinations: Array<{
    status: string;
    publishedAt: string | null;
    destination: { type: string; name: string };
  }>;
};

export default function PostsAnalysisPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const headers = authHeaders();
    if (!headers) {
      router.push('/login');
      return;
    }
    fetch(`${apiUrl}/posts`, { headers })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
            return;
          }
          throw new Error('Failed to load');
        }
        return res.json();
      })
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false));
  }, [apiUrl, router]);

  const platformLabel = (type: string) => {
    const m: Record<string, string> = {
      facebook_page: 'Facebook',
      instagram_business: 'Instagram',
      tiktok_account: 'TikTok',
      twitter_account: 'X (Twitter)',
    };
    return m[type] || type;
  };


  const totals = useMemo(() => {
    let total = 0;
    let published = 0;
    const byPlatform: Record<string, number> = {};
    for (const post of posts) {
      total += 1;
      if (post.status === 'published') published += 1;
      for (const d of post.destinations) {
        const p = platformLabel(d.destination.type);
        byPlatform[p] = (byPlatform[p] || 0) + 1;
      }
    }
    return { total, published, byPlatform };
  }, [posts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <AdminNav title="MagiComputers · Posts Analysis" backHref="/posts" />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading analysis…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <AdminNav title="MagiComputers · Posts Analysis" backHref="/posts" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Posts analysis</h2>
          <div className="flex items-center gap-3">
            <PostsViewTabs />
            <Link href="/posts" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 border border-slate-200">
              View all posts
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-sm font-medium text-gray-500">Total posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totals.total}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-500">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{totals.published}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-500">By platform</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(totals.byPlatform).map(([platform, count]) => (
                <span
                  key={platform}
                  className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {platform}: {count}
                </span>
              ))}
              {Object.keys(totals.byPlatform).length === 0 && (
                <span className="text-sm text-gray-400">No data</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
