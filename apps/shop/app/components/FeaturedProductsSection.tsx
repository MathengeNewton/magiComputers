'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  currency: string;
  listPrice?: number | string;
  price?: number | string;
  images?: Array<{ media?: { url: string } }>;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'object' && value && 'toString' in value) {
    return Number((value as { toString(): string }).toString());
  }
  return Number(value);
};

export default function FeaturedProductsSection() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(
    () => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    []
  );

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${apiUrl}/store/products/featured?tenantId=${tenantId}&limit=8`);
        if (!res.ok) return;
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [apiUrl, tenantId]);

  return (
    <section className="py-16 border-t border-shop-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-shop-muted">Products</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-shop-fg">Featured products</h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shop-card border border-shop-border rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/30 transition-colors"
          >
            Buy all
            <span aria-hidden>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-shop-card border border-shop-border rounded-xl p-4 animate-pulse h-72" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-shop-card border border-shop-border rounded-xl p-8 text-center text-shop-muted">
            No featured products yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/p/${product.slug}`}
                className="group bg-shop-card border border-shop-border rounded-xl overflow-hidden hover:border-shop-muted transition-colors"
              >
                <div className="aspect-square bg-shop-bg overflow-hidden">
                  {product.images?.[0]?.media?.url ? (
                    <img
                      src={product.images[0].media.url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-shop-muted text-sm">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-shop-fg line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-shop-muted mt-1 line-clamp-2">{product.description}</p>
                  <p className="text-lg font-bold text-shop-fg mt-3">
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
      </div>
    </section>
  );
}
