'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';
import { getErrorMessage } from '@/lib/error-handler';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui';

interface Pet {
  id: number;
  name: string;
  ownerId: number;
  breedId: number;
  petTypeId: number;
  deviceId?: number;
  birthDate?: string;
  isActive: boolean;
  breed?: { id: number; name: string };
  petType?: { id: number; name: string };
  device?: { id: number; serialNumber: string };
}

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, refreshSession, logout } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  const petId = params.id as string;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      refreshSession().then((res) => {
        if (!res) router.push('/login');
      });
    }
  }, [isLoading, isAuthenticated, refreshSession, router]);

  useEffect(() => {
    if (!isAuthenticated || !petId) return;
    apiClient.get<Pet>(`/v1/api/zootag/client/pets/${petId}`)
      .then(({ result }) => setPet(result))
      .catch((e) => { showError(getErrorMessage(e)); })
      .finally(() => setLoading(false));
  }, [isAuthenticated, petId]);

  const handleDelete = async () => {
    if (!pet) return;
    try {
      await apiClient.delete(`/v1/api/zootag/client/pets/${pet.id}`);
      showSuccess('پت با موفقیت حذف شد');
      router.push('/dashboard/pets');
    } catch (e) {
      showError(getErrorMessage(e));
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">در حال انتقال...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">پت یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-border bg-white dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">زوتگ</a>
            <span className="text-xs text-muted">/</span>
            <a href="/dashboard/pets" className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">پت‌های من</a>
            <span className="text-xs text-muted">/</span>
            <span className="text-sm text-muted">{pet.name}</span>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="text-xs text-muted hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.push('/dashboard/pets')}
          className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت
        </button>

        <div className="rounded-xl border border-border bg-white p-6 dark:bg-zinc-900">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {pet.name[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{pet.name}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {pet.petType?.name ?? '—'} · {pet.breed?.name ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-zinc-900">
            <p className="text-xs font-medium text-muted">نوع حیوان</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{pet.petType?.name ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-zinc-900">
            <p className="text-xs font-medium text-muted">نژاد</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{pet.breed?.name ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-zinc-900">
            <p className="text-xs font-medium text-muted">دستگاه ردیاب</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {pet.device ? (
                <Badge variant="info" size="sm">{pet.device.serialNumber}</Badge>
              ) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-zinc-900">
            <p className="text-xs font-medium text-muted">تاریخ تولد</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{pet.birthDate ?? '—'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
