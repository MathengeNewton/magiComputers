'use client';

import Link from 'next/link';
import ShopHeader from './components/ShopHeader';
import ShopFooter from './components/ShopFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-shop-bg flex flex-col">
      <ShopHeader />

      <main className="flex-1 flex flex-col">
        {/* Hero: slightly lighter than header for layering */}
        <section className="relative flex-1 py-24 sm:py-32 overflow-hidden bg-shop-hero">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-shop-fg mb-4 tracking-tight">
              MagiComputers
            </h1>
            <p className="text-lg sm:text-xl text-shop-muted mb-12 max-w-xl mx-auto">
              Shop electronics or book a repair. We&apos;re here to help.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-base shadow-sm border border-slate-200/50 dark:border-slate-600/50"
              >
                Shop now
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <Link
                href="/repair"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-shop-card border border-shop-border text-shop-fg font-semibold rounded-lg hover:bg-shop-border/30 transition-colors text-base"
              >
                Book repair
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>

            <p className="mt-10 text-sm">
              <Link href="/about" className="text-blue-500 hover:text-blue-400 hover:underline">About us</Link>
              <span className="text-shop-muted mx-1">·</span>
              <Link href="/contact" className="text-blue-500 hover:text-blue-400 hover:underline">Contact</Link>
            </p>
          </div>
        </section>
      </main>

      <ShopFooter />
    </div>
  );
}
