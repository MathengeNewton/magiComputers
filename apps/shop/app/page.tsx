'use client';

import Link from 'next/link';
import ShopHeader from './components/ShopHeader';
import FeaturedProductsSection from './components/FeaturedProductsSection';
import WorkstationSetupsSection from './components/WorkstationSetupsSection';
import { useEffect, useMemo, useState } from 'react';

type HomepageConfig = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string | null;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
};

const defaultHomepageConfig: HomepageConfig = {
  heroEyebrow: 'MagiComputers',
  heroTitle: 'Electronics and repairs done right.',
  heroDescription:
    'From custom workstation builds to day-to-day devices, we supply quality gear and dependable repair support for homes and offices.',
  heroImageUrl: null,
  primaryButtonLabel: 'Shop now',
  primaryButtonHref: '/shop',
  secondaryButtonLabel: 'Book repair',
  secondaryButtonHref: '/repair',
};

export default function HomePage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', []);
  const tenantId = useMemo(
    () => process.env.NEXT_PUBLIC_STORE_TENANT_ID || '00000000-0000-0000-0000-000000000001',
    []
  );
  const [config, setConfig] = useState<HomepageConfig>(defaultHomepageConfig);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch(`${apiUrl}/store/homepage-config?tenantId=${tenantId}`);
        if (!res.ok) return;
        const data = await res.json();
        setConfig({
          heroEyebrow: data.heroEyebrow || defaultHomepageConfig.heroEyebrow,
          heroTitle: data.heroTitle || defaultHomepageConfig.heroTitle,
          heroDescription: data.heroDescription || defaultHomepageConfig.heroDescription,
          heroImageUrl: data.heroImageUrl || null,
          primaryButtonLabel: data.primaryButtonLabel || defaultHomepageConfig.primaryButtonLabel,
          primaryButtonHref: data.primaryButtonHref || defaultHomepageConfig.primaryButtonHref,
          secondaryButtonLabel: data.secondaryButtonLabel || defaultHomepageConfig.secondaryButtonLabel,
          secondaryButtonHref: data.secondaryButtonHref || defaultHomepageConfig.secondaryButtonHref,
        });
      } catch {
        // Keep defaults if config fetch fails.
      }
    };
    loadConfig();
  }, [apiUrl, tenantId]);

  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />

      <main className="flex-1 flex flex-col">
        <section className="relative py-14 sm:py-20 overflow-hidden bg-shop-hero border-b border-shop-border/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-shop-muted mb-4">{config.heroEyebrow}</p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-shop-fg mb-5 tracking-tight">
                  {config.heroTitle}
                </h1>
                <p className="text-lg text-shop-muted mb-8 max-w-xl">
                  {config.heroDescription}
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                  <Link
                    href={config.primaryButtonHref}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-base shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                  >
                    {config.primaryButtonLabel}
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Link>
                  <Link
                    href={config.secondaryButtonHref}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-shop-card border border-shop-border text-shop-fg font-semibold rounded-lg hover:bg-shop-border/30 transition-colors text-base"
                  >
                    {config.secondaryButtonLabel}
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-shop-accent/10 blur-xl" />
                <img
                  src={
                    config.heroImageUrl ||
                    'https://images.unsplash.com/photo-1580974852861-c381510bc98b?auto=format&fit=crop&w=1400&q=80'
                  }
                  alt="Repair workstation and electronics tools"
                  className="relative w-full h-[320px] sm:h-[400px] object-cover rounded-2xl border border-shop-border shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        <FeaturedProductsSection />
        <WorkstationSetupsSection />
      </main>
    </div>
  );
}
