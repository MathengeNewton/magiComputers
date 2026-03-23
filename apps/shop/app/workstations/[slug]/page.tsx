'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ShopHeader from '../../components/ShopHeader';

type WorkstationDetail = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  coverImageUrl?: string | null;
  products: Array<{
    id: string;
    slug: string;
    title: string;
    currency: string;
    listPrice?: number | string;
    price?: number | string;
    imageUrl?: string | null;
  }>;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'object' && value && 'toString' in value) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
};

export default function WorkstationDetailPage() {
  const params = useParams<{ slug: string }>();
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(
    () => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    []
  );

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<WorkstationDetail | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`${apiUrl}/store/workstations/${params.slug}?tenantId=${tenantId}`);
        if (!res.ok) return;
        setItem(await res.json());
      } finally {
        setLoading(false);
      }
    };
    if (params.slug) fetchDetail();
  }, [apiUrl, params.slug, tenantId]);

  return (
    <div className="min-h-screen bg-shop-bg">
      <ShopHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center text-shop-muted">Loading setup...</div>
        ) : !item ? (
          <div className="py-24 text-center">
            <p className="text-shop-muted mb-4">Workstation setup not found.</p>
            <Link href="/" className="text-shop-accent hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <Link href="/" className="text-sm text-shop-muted hover:text-shop-fg">
              ← Back
            </Link>
            <div className="grid lg:grid-cols-2 gap-10 mt-4 mb-10">
              <div className="rounded-2xl overflow-hidden border border-shop-border bg-shop-card">
                {item.coverImageUrl ? (
                  <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover min-h-[260px]" />
                ) : (
                  <div className="min-h-[260px] flex items-center justify-center text-shop-muted">No cover image</div>
                )}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-shop-fg">{item.title}</h1>
                <p className="text-shop-muted mt-3">{item.summary}</p>
                {item.description && <p className="text-shop-muted mt-4 whitespace-pre-wrap">{item.description}</p>}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-shop-fg mb-5">Products used in this setup</h2>
            {item.products.length === 0 ? (
              <div className="bg-shop-card border border-shop-border rounded-xl p-8 text-center text-shop-muted">
                No linked products for this setup yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {item.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/p/${product.slug}`}
                    className="bg-shop-card border border-shop-border rounded-xl overflow-hidden hover:border-shop-muted transition-colors"
                  >
                    <div className="aspect-square bg-shop-bg">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-shop-muted text-sm">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-shop-fg line-clamp-1">{product.title}</h3>
                      <p className="text-lg font-bold text-shop-fg mt-2">
                        {product.currency}{' '}
                        {toNumber(product.listPrice ?? product.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
