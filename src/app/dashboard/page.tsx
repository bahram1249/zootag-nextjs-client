'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession, getToken, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      refreshSession().then((res) => {
        if (!res) router.push('/login');
      });
    }
  }, [isLoading, isAuthenticated, refreshSession, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-border bg-white dark:bg-zinc-900 dark:border-zinc-700">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Zootag</h1>
          <div className="flex items-center gap-3">
            <Badge variant="success" size="sm">Authenticated</Badge>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="text-xs text-muted hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
        <p className="mt-1 text-sm text-muted">You are signed in.</p>
      </main>
    </div>
  );
}
