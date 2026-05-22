'use client';

import { useState, useRef, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/auth';
import { Input, Badge } from '@/components/ui';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signin(username.trim(), password);
      const redirect = searchParams.get('redirect') || '/admin';
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'نام کاربری یا رمز عبور اشتباه است');
      } else {
        setError('خطای غیرمنتظره‌ای رخ داد');
      }
      usernameRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-border bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
        {/* header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            خوش آمدید
          </h1>
          <p className="mt-1 text-sm text-muted">
            برای ادامه وارد حساب کاربری خود شوید
          </p>
        </div>

        {/* error banner */}
        {error && (
          <div className="mb-6">
            <Badge
              variant="danger"
              size="lg"
              className="w-full justify-center py-2 text-xs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </Badge>
          </div>
        )}

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={usernameRef}
            label="نام کاربری"
            placeholder="نام کاربری خود را وارد کنید"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoComplete="username"
            autoFocus
          />

          <Input
            label="رمز عبور"
            type="password"
            placeholder="رمز عبور خود را وارد کنید"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="
              mt-2 flex h-10 w-full items-center justify-center gap-2
              rounded-[var(--radius-input)] bg-primary px-4 text-sm font-medium text-white
              transition-all duration-200
              hover:bg-primary-hover
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {loading ? (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : null}
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        {/* divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 border-t border-border dark:border-zinc-700" />
          <span className="text-xs text-muted">یا</span>
          <div className="flex-1 border-t border-border dark:border-zinc-700" />
        </div>

        {/* signup link */}
        <p className="mt-6 text-center text-sm text-muted">
          حساب کاربری ندارید؟{' '}
          <a
            href="/signup"
            className="font-medium text-primary hover:text-primary-hover transition-colors"
          >
            ایجاد حساب
          </a>
        </p>
      </div>
    </div>
  );
}
