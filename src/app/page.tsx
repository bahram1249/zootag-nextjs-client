'use client';

import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui';

function UserGreeting() {
  const { user } = useAuth();
  const name = user?.firstname || user?.username || 'کاربر';

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-lg font-bold">
        {name[0]}
      </div>
      <div>
        <p className="text-sm text-muted">خوش آمدید</p>
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{name}</p>
      </div>
    </div>
  );
}

function AuthenticatedView() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center gap-6 text-center">
          <UserGreeting />

          <Badge variant="success" size="sm">
            وارد شده
          </Badge>

          <p className="text-muted text-sm leading-6">
            به زوتگ خوش آمدید. می‌توانید از منوی بالا برای مدیریت برچسب‌ها استفاده کنید.
          </p>

          <button
            onClick={logout}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-secondary hover:border-border-hover"
          >
            خروج از حساب
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          زوتگ
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          برنامه برچسب‌گذاری هوشمند — اشیاء خود را دسته‌بندی، جستجو و مدیریت کنید.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-white transition-colors hover:bg-primary-hover sm:w-auto"
          >
            ورود به حساب
          </a>
          <a
            href="/signup"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-8 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-secondary sm:w-auto"
          >
            ثبت‌نام
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedView /> : <GuestView />;
}
