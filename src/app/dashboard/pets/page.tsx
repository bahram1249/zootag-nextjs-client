'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface Breed {
  id: number;
  name: string;
  petType: { id: number; name: string };
}

interface DeviceLookupResult {
  id: number;
  serialNumber: string;
  available: boolean;
  deviceTypeName?: string;
  modelCode?: string;
}

export default function PetsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession, logout } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formBreedId, setFormBreedId] = useState<number | null>(null);
  const [formDeviceSerial, setFormDeviceSerial] = useState('');
  const [formDeviceLookup, setFormDeviceLookup] = useState<DeviceLookupResult | null>(null);
  const [formDeviceId, setFormDeviceId] = useState<number | null>(null);
  const [formBirthDate, setFormBirthDate] = useState('');

  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [deviceLookupLoading, setDeviceLookupLoading] = useState(false);
  const [deviceLookupError, setDeviceLookupError] = useState('');

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
    apiClient.get<Breed[]>('/v1/api/zootag/client/petBreeds', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setBreeds(result))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleDeviceLookup = async () => {
    if (!formDeviceSerial.trim()) return;
    setDeviceLookupLoading(true);
    setDeviceLookupError('');
    setFormDeviceLookup(null);
    setFormDeviceId(null);
    try {
      const { result } = await apiClient.get<DeviceLookupResult>(
        `/v1/api/zootag/client/pets/device-lookup/${encodeURIComponent(formDeviceSerial.trim())}`,
      );
      setFormDeviceLookup(result);
      if (result.available && result.id > 0) {
        setFormDeviceId(result.id);
      } else {
        setDeviceLookupError(result.id === 0 ? 'دستگاه با این شماره سریال یافت نشد' : 'این دستگاه قابل استفاده نیست');
      }
    } catch (e) {
      setDeviceLookupError(getErrorMessage(e));
    } finally {
      setDeviceLookupLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormName('');
    setFormBreedId(null);
    setFormDeviceSerial('');
    setFormDeviceLookup(null);
    setFormDeviceId(null);
    setFormBirthDate('');
    setDeviceLookupError('');
  };

  const handleCreate = async () => {
    if (!formName.trim() || formBreedId == null || formDeviceId == null) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formName.trim(),
        breedId: formBreedId,
        deviceId: formDeviceId,
      };
      if (formBirthDate) payload.birthDate = formBirthDate;
      await apiClient.post('/v1/api/zootag/client/pets', payload);
      showSuccess('پت با موفقیت ثبت شد');
      resetForm();
      fetchPets();
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pet: Pet) => {
    try {
      await apiClient.delete(`/v1/api/zootag/client/pets/${pet.id}`);
      showSuccess('پت با موفقیت حذف شد');
      fetchPets();
    } catch (e) {
      showError(getErrorMessage(e));
    }
  };

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
            <p className="mt-0.5 text-sm text-muted">مدیریت پت‌های خود</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            افزودن پت
          </button>
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
          <div className="overflow-x-auto rounded-xl border border-border bg-white dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">نام</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">نوع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">نژاد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">دستگاه</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">تاریخ تولد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.id} className="border-b border-border transition-colors last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{pet.name}</td>
                    <td className="px-4 py-3 text-muted">{pet.petType?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{pet.breed?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {pet.device ? (
                        <Badge variant="info" size="sm">{pet.device.serialNumber}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{pet.birthDate ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(pet)}
                        className="flex h-7 items-center rounded px-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">افزودن پت جدید</h3>
                <button onClick={resetForm} disabled={saving} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">نام پت <span className="text-danger">*</span></label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                    placeholder="نام پت را وارد کنید"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">نژاد <span className="text-danger">*</span></label>
                  <select
                    value={formBreedId ?? ''}
                    onChange={(e) => setFormBreedId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                  >
                    <option value="">انتخاب نژاد...</option>
                    {breeds.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.petType.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">شماره سریال دستگاه <span className="text-danger">*</span></label>
                  <div className="flex gap-2">
                    <input
                      value={formDeviceSerial}
                      onChange={(e) => { setFormDeviceSerial(e.target.value); setFormDeviceLookup(null); setFormDeviceId(null); setDeviceLookupError(''); }}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                      placeholder="شماره سریال را وارد کنید"
                    />
                    <button
                      onClick={handleDeviceLookup}
                      disabled={deviceLookupLoading || !formDeviceSerial.trim()}
                      className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {deviceLookupLoading ? '...' : 'بررسی'}
                    </button>
                  </div>
                  {deviceLookupLoading && <p className="mt-1 text-xs text-muted">در حال بررسی...</p>}
                  {deviceLookupError && <p className="mt-1 text-xs text-danger">{deviceLookupError}</p>}
                  {formDeviceLookup && formDeviceLookup.available && formDeviceLookup.id > 0 && (
                    <div className="mt-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-xs text-success">
                      دستگاه {formDeviceLookup.serialNumber} ({formDeviceLookup.deviceTypeName ?? ''} {formDeviceLookup.modelCode ?? ''}) قابل استفاده است
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">تاریخ تولد</label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={resetForm}
                  disabled={saving}
                  className="flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !formName.trim() || formBreedId == null || formDeviceId == null}
                  className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ثبت...
                    </span>
                  ) : 'ثبت پت'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
