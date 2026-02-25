'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '../components/AdminNav';

type Stats = {
  products: number;
  orders: number;
  posts: number;
  integrations: number;
  totalSales: number;
  publishedPosts: number;
  pendingOrders: number;
  completeOrders: number;
  tiktokPosts: number;
  facebookPosts: number;
  instagramPosts: number;
  twitterPosts: number;
};
type ActivityItem = { type: 'post' | 'order'; id: string; label: string; createdAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    products: 0,
    orders: 0,
    posts: 0,
    integrations: 0,
    totalSales: 0,
    publishedPosts: 0,
    pendingOrders: 0,
    completeOrders: 0,
    tiktokPosts: 0,
    facebookPosts: 0,
    instagramPosts: 0,
    twitterPosts: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        const meRes = await fetch(`${apiUrl}/auth/me`, { headers });
        if (!meRes.ok) throw new Error('Unauthorized');
        const userData = await meRes.json();
        setUser(userData);

        const [statsRes, activityRes] = await Promise.all([
          fetch(`${apiUrl}/dashboard/stats`, { headers }),
          fetch(`${apiUrl}/dashboard/activity`, { headers }),
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivity(Array.isArray(activityData) ? activityData : []);
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600 rounded-full mb-4" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const statCards = [
    { label: 'Total Sales', value: formatCurrency(stats.totalSales), icon: '💰', color: 'from-emerald-500 to-emerald-600', highlight: true },
    { label: 'Orders', value: String(stats.orders), icon: '🛒', color: 'from-blue-500 to-blue-600' },
    { label: 'Pending Orders', value: String(stats.pendingOrders), icon: '⏳', color: 'from-amber-500 to-amber-600' },
    { label: 'Complete Orders', value: String(stats.completeOrders), icon: '✅', color: 'from-green-500 to-green-600' },
    { label: 'Total Posts', value: String(stats.posts), icon: '📝', color: 'from-purple-500 to-purple-600' },
    { label: 'Published Posts', value: String(stats.publishedPosts), icon: '🚀', color: 'from-indigo-500 to-indigo-600' },
    { label: 'TikTok Posts', value: String(stats.tiktokPosts), icon: '🎵', color: 'from-slate-800 to-slate-900' },
    { label: 'Facebook Posts', value: String(stats.facebookPosts), icon: '📘', color: 'from-blue-600 to-blue-700' },
    { label: 'Instagram Posts', value: String(stats.instagramPosts), icon: '📷', color: 'from-pink-500 to-purple-600' },
    { label: 'Twitter Posts', value: String(stats.twitterPosts), icon: '𝕏', color: 'from-slate-700 to-slate-800' },
    { label: 'Products', value: String(stats.products), icon: '📦', color: 'from-cyan-500 to-cyan-600' },
    { label: 'Integrations', value: String(stats.integrations), icon: '🔗', color: 'from-violet-500 to-violet-600' },
  ];

  function formatTimeAgo(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
    return d.toLocaleDateString();
  }

  const quickActions = [
    { title: 'Shop', href: process.env.NEXT_PUBLIC_SHOP_URL || 'http://localhost:3003', icon: '🛍️', external: true },
    { title: 'Catalog', href: '/catalog', icon: '📦' },
    { title: 'Orders', href: '/orders', icon: '🛒' },
    { title: 'Enquiries', href: '/enquiries', icon: '📋' },
    { title: 'Posts', href: '/posts', icon: '📝' },
    { title: 'Calendar', href: '/posts/calendar', icon: '📅' },
    ...(isAdmin ? [{ title: 'Suppliers', href: '/suppliers', icon: '🏢' }] : []),
    ...(isAdmin ? [{ title: 'Integrations', href: '/integrations', icon: '🔗' }] : []),
    ...(isAdmin ? [{ title: 'Staff', href: '/staff', icon: '👤' }] : []),
    ...(!isAdmin ? [{ title: 'Compose', href: '/compose', icon: '✏️' }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav title="MagiComputers" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {user?.name || user?.email?.split('@')[0] || 'Admin'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of your store</p>
        </div>

        {/* Stats */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-slate-500 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`bg-white rounded-xl border border-slate-200/80 px-5 py-4 shadow-sm ${
                  stat.highlight ? 'ring-2 ring-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <p className={`text-2xl font-semibold tabular-nums mt-1 ${
                  stat.highlight ? 'text-emerald-700' : 'text-slate-900'
                }`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 shadow-sm hover:border-slate-300 hover:shadow transition-all"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-slate-700">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1 text-slate-400">Posts and orders will appear here</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                    item.type === 'post' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.type === 'post' ? 'P' : 'O'}
                  </span>
                  <span className="flex-1 text-sm text-slate-700 truncate">{item.label}</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatTimeAgo(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
