'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';
import { getErrorMessage } from '@/lib/error-handler';
import { apiClient } from '@/lib/api-client';

interface Pet {
  id: number;
  name: string;
  breedId: number;
  petTypeId: number;
  birthDate?: string;
  breed?: { id: number; name: string };
  petType?: { id: number; name: string };
  device?: { id: number; serialNumber: string };
}

export default function PetsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession, logout } = useAuth();
  const { showError } = useNotification();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      refreshSession().then((res) => {
        if (!res) router.push('/login');
      });
    }
  }, [isLoading, isAuthenticated, refreshSession, router]);

  const fetchPets = () => {
    setLoading(true);
    apiClient.get<Pet[]>('/v1/api/zootag/client/pets', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setPets(result))
      .catch((e) => { showError(getErrorMessage(e)); setPets([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPets();
  }, [isAuthenticated]);

  const petTypeIcon = (typeId?: number) => (typeId === 1 ? '🐕' : '🐈');

  const bgColors = [
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
  ];

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-border bg-white dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">زوتگ</a>
            <span className="text-xs text-muted">/</span>
            <span className="text-sm text-muted">پت‌های من</span>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/login'); }}
            className="text-xs text-muted hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">پت‌های من</h2>
            <p className="mt-0.5 text-sm text-muted">
              {pets.length === 0 ? 'هنوز پتی ثبت نکرده‌اید' : `${pets.length} پت`}
            </p>
          </div>
          <a
            href="/dashboard/pets/add"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            افزودن پت
          </a>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : pets.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-white dark:bg-zinc-900">
            <p className="text-sm text-muted">هیچ پتی ثبت نشده است</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet, i) => (
              <a
                key={pet.id}
                href={`/dashboard/pets/${pet.id}`}
                className="group rounded-xl border border-border bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/30 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${bgColors[i % bgColors.length]}`}>
                    {pet.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate group-hover:text-primary transition-colors dark:text-zinc-100">
                      {pet.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted truncate">
                      {petTypeIcon(pet.petTypeId)} {pet.breed?.name ?? ''}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {pet.device && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {pet.device.serialNumber}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
