'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

const ACCESS_TOKEN_KEY = 'shop_customer_access_token';
const REFRESH_TOKEN_KEY = 'shop_customer_refresh_token';
const CUSTOMER_KEY = 'shop_customer_profile';

type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  tenantId: string;
};

type CustomerAuthContextValue = {
  customer: Customer | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  loginByPhone: (phone: string, password: string) => Promise<void>;
  registerByPhone: (data: { name: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({
  children,
  apiUrl,
  tenantId,
}: {
  children: React.ReactNode;
  apiUrl: string;
  tenantId: string;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(
    (tokens: { accessToken: string; refreshToken: string } | null, profile: Customer | null) => {
      if (typeof window === 'undefined') return;
      if (tokens) {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      if (profile) {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(CUSTOMER_KEY);
      }
    },
    [],
  );

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const profileStr = localStorage.getItem(CUSTOMER_KEY);
    const profile = profileStr ? (JSON.parse(profileStr) as Customer) : null;
    if (!refreshToken || !profile?.id) return false;
    try {
      const res = await fetch(`${apiUrl}/store/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, customerId: profile.id }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setAccessToken(data.accessToken);
      setCustomer(data.customer ?? profile);
      persist({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.customer ?? profile);
      return true;
    } catch {
      return false;
    }
  }, [apiUrl, persist]);

  const fetchMe = useCallback(async (token: string) => {
    const res = await fetch(`${apiUrl}/store/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  }, [apiUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const profileStr = localStorage.getItem(CUSTOMER_KEY);
    if (!token) {
      setAccessToken(null);
      setCustomer(null);
      setLoading(false);
      return;
    }
    (async () => {
      const profile = await fetchMe(token);
      if (profile) {
        setAccessToken(token);
        setCustomer(profile);
      } else {
        const ok = await refreshTokens();
        if (!ok) {
          setAccessToken(null);
          setCustomer(null);
          persist(null, null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${apiUrl}/store/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
      setCustomer(data.customer);
      persist(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.customer,
      );
    },
    [apiUrl, tenantId, persist],
  );

  const register = useCallback(
    async (data: { email: string; password: string; name: string; phone?: string }) => {
      const res = await fetch(`${apiUrl}/store/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }
      const out = await res.json();
      setAccessToken(out.accessToken);
      setCustomer(out.customer);
      persist(
        { accessToken: out.accessToken, refreshToken: out.refreshToken },
        out.customer,
      );
    },
    [apiUrl, tenantId, persist],
  );

  const loginByPhone = useCallback(
    async (phone: string, password: string) => {
      const res = await fetch(`${apiUrl}/store/repair/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, phone, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login failed');
      }
      const data = await res.json();
      setAccessToken(data.accessToken);
      setCustomer(data.customer);
      persist(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.customer,
      );
    },
    [apiUrl, tenantId, persist],
  );

  const registerByPhone = useCallback(
    async (data: { name: string; phone: string; password: string }) => {
      const res = await fetch(`${apiUrl}/store/repair/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Registration failed');
      }
      const out = await res.json();
      setAccessToken(out.accessToken);
      setCustomer(out.customer);
      persist(
        { accessToken: out.accessToken, refreshToken: out.refreshToken },
        out.customer,
      );
    },
    [apiUrl, tenantId, persist],
  );

  const logout = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      try {
        await fetch(`${apiUrl}/store/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    setAccessToken(null);
    setCustomer(null);
    persist(null, null);
  }, [apiUrl, persist]);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return;
    const profile = await fetchMe(token);
    if (profile) {
      setCustomer(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(profile));
      }
    }
  }, [fetchMe]);

  const value: CustomerAuthContextValue = {
    customer,
    accessToken,
    loading,
    login,
    register,
    loginByPhone,
    registerByPhone,
    logout,
    refreshProfile,
    isAuthenticated: !!accessToken && !!customer,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
