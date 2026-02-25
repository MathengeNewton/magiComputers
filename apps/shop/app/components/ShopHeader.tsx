'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

type ShopHeaderProps = {
  categories?: { id: string; name: string; slug: string }[];
  currentCategory?: string;
};

export default function ShopHeader({ categories = [], currentCategory }: ShopHeaderProps) {
  const { itemCount } = useCart();
  const { isAuthenticated, logout } = useCustomerAuth();

  return (
    <header className="bg-shop-bg border-b border-shop-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-shop-fg hover:opacity-90 transition-opacity">
            MagiComputers
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/shop"
              className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/repair"
              className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
            >
              Repair
            </Link>
            {isAuthenticated && (
              <Link
                href="/repair/tickets"
                className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
              >
                My tickets
              </Link>
            )}
            <Link
              href="/about"
              className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
            >
              About us
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
            >
              Contact us
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link
                  href="/repair/tickets"
                  className="p-2 text-shop-fg hover:bg-shop-border/50 rounded-lg transition-colors"
                  aria-label="My tickets"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-lg text-sm font-medium text-shop-fg hover:bg-shop-border/50 transition-colors"
              >
                Log in
              </Link>
            )}
            <Link
              href="/cart"
              className="relative p-2 text-shop-fg hover:bg-shop-border/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[11px] font-semibold rounded-full flex items-center justify-center ring-2 ring-shop-card">
                {itemCount}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
