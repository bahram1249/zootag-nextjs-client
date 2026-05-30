'use client';

import { useAuth } from '@/contexts/auth-context';
import { Slider } from '@/components/ui';

const slides = [
  {
    src: '/images/hero-dog.jpg',
    alt: 'سگ با ردیاب',
    title: 'حیوان خود را ردیابی کنید',
    subtitle: 'نصب ردیاب روی قلاده سگ و گربه',
  },
  {
    src: '/images/hero-cat.jpg',
    alt: 'گربه با ردیاب',
    title: 'محدوده امن تعریف کنید',
    subtitle: 'با Polygon روی نقشه محدوده امن رسم کنید',
  },
  {
    src: '/images/hero-tracking.jpg',
    alt: 'ردیابی ماهواره‌ای',
    title: 'هشدار خروج از محدوده',
    subtitle: 'به محض خروج حیوان از محدوده، نوتیفیکیشن دریافت کنید',
  },
];

export function LandingContent() {
  const { isAuthenticated, user } = useAuth();
  const name = user?.firstname || user?.username || 'کاربر';

  return (
    <>
      {/* Header */}
      <header className="relative z-10 border-b border-border bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">زوتگ</span>
          </div>
          {isAuthenticated ? (
            <a
              href="/dashboard"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              داشبورد
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-secondary"
              >
                ورود
              </a>
              <a
                href="/signup"
                className="flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                ثبت‌نام
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Slider */}
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <Slider slides={slides} />
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-success" />
          سامانه ردیابی هوشمند حیوانات خانگی
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          حیوان خانگی‌ات همیشه{' '}
          <span className="text-primary">تحت نظر</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
          با زوتگ یک دستگاه ردیاب روی گردن حیوان خود نصب کنید و محدوده امن (Polygon)
          تعریف کنید. هر زمان حیوان از محدوده خارج شد، سریع مطلع شوید.
        </p>

        {isAuthenticated ? (
          <div className="mt-10">
            <a
              href="/dashboard"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ورود به داشبورد
            </a>
            <p className="mt-3 text-sm text-muted">{name} عزیز، خوش آمدید</p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/signup"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
            >
              شروع کنید
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-8 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-secondary sm:w-auto"
            >
              ورود به حساب
            </a>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="group overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-shadow hover:shadow-md dark:bg-zinc-900">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="/images/feature-collar.jpg"
                alt="ردیاب روی گردن"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ردیاب روی گردن</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                یک دستگاه ردیاب کوچک روی قلاده حیوان نصب می‌شود و موقعیت آن را به صورت لحظه‌ای به سامانه ارسال می‌کند.
              </p>
            </div>
          </div>

          <div className="group overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-shadow hover:shadow-md dark:bg-zinc-900">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="/images/feature-map.jpg"
                alt="محدوده امن"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">محدوده امن (Polygon)</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                روی نقشه یک محدوده امن به صورت چندضلعی رسم کنید. حیوان تا داخل این محدوده آزاد است — خروج از محدوده هشدار می‌دهد.
              </p>
            </div>
          </div>

          <div className="group overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-shadow hover:shadow-md dark:bg-zinc-900">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="/images/feature-alert.jpg"
                alt="هشدار لحظه‌ای"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">هشدار لحظه‌ای</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                اگر حیوان از محدوده امن خارج شود یا ردیاب قطع شود، بلافاصله نوتیفیکیشن دریافت می‌کنید.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">چگونه کار می‌کند؟</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-4">
            {[
              { step: '۱', title: 'ثبت‌نام', desc: 'حساب کاربری بسازید و وارد شوید.' },
              { step: '۲', title: 'ثبت پت', desc: 'اطلاعات حیوان خود را ثبت و ردیاب را به آن متصل کنید.' },
              { step: '۳', title: 'تعریف محدوده', desc: 'روی نقشه محدوده امن (Polygon) رسم کنید.' },
              { step: '۴', title: 'ردیابی', desc: 'موقعیت حیوان را لحظه‌ای رصد کنید و از خروج آن مطلع شوید.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted">
          زوتگ — سامانه ردیابی هوشمند حیوانات خانگی
        </div>
      </footer>
    </>
  );
}
