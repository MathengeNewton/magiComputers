'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Workstation = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  coverImageUrl?: string | null;
  productCount?: number;
};

export default function WorkstationSetupsSection() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(
    () => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    []
  );

  const [loading, setLoading] = useState(true);
  const [setups, setSetups] = useState<Workstation[]>([]);

  useEffect(() => {
    const fetchSetups = async () => {
      try {
        const res = await fetch(`${apiUrl}/store/workstations?tenantId=${tenantId}&limit=6`);
        if (!res.ok) return;
        const data = await res.json();
        setSetups(Array.isArray(data) ? data : data.items || []);
      } finally {
        setLoading(false);
      }
    };
    fetchSetups();
  }, [apiUrl, tenantId]);

  return (
    <section className="py-16 border-t border-shop-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-shop-muted">Showcase</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-shop-fg">Client workstation setups</h2>
            <p className="text-sm text-shop-muted mt-2">
              See completed setups and buy the exact gear used in each project.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-shop-card border border-shop-border rounded-xl p-4 animate-pulse h-80" />
            ))}
          </div>
        ) : setups.length === 0 ? (
          <div className="bg-shop-card border border-shop-border rounded-xl p-8 text-center text-shop-muted">
            No workstation setups published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {setups.map((setup) => (
              <article key={setup.id} className="bg-shop-card border border-shop-border rounded-xl overflow-hidden">
                <div className="aspect-[16/10] bg-shop-bg">
                  {setup.coverImageUrl ? (
                    <img src={setup.coverImageUrl} alt={setup.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-shop-muted text-sm">No image</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-shop-fg">{setup.title}</h3>
                  <p className="text-sm text-shop-muted mt-2 line-clamp-3">{setup.summary}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-shop-muted">
                      {(setup.productCount ?? 0).toString()} linked product
                      {setup.productCount === 1 ? '' : 's'}
                    </span>
                    <Link
                      href={`/workstations/${setup.slug}`}
                      className="text-sm font-medium text-shop-accent hover:underline"
                    >
                      View setup
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
