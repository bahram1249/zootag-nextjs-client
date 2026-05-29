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

interface PetType {
  id: number;
  name: string;
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

const steps = ['نوع پت', 'نژاد', 'دستگاه', 'اطلاعات'];

export default function PetsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession, logout } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [showStepper, setShowStepper] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — pet type
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Step 2 — breed
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [selectedBreedId, setSelectedBreedId] = useState<number | null>(null);

  // Step 3 — device
  const [formDeviceSerial, setFormDeviceSerial] = useState('');
  const [deviceLookupLoading, setDeviceLookupLoading] = useState(false);
  const [deviceLookupError, setDeviceLookupError] = useState('');
  const [formDeviceLookup, setFormDeviceLookup] = useState<DeviceLookupResult | null>(null);
  const [formDeviceId, setFormDeviceId] = useState<number | null>(null);

  // Step 4 — info
  const [formName, setFormName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');

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
    apiClient.get<PetType[]>('/v1/api/zootag/client/petTypes', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setPetTypes(result))
      .catch(() => {});
    apiClient.get<Breed[]>('/v1/api/zootag/client/petBreeds', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setBreeds(result))
      .catch(() => {});
  }, [isAuthenticated]);

  const filteredBreeds = breeds.filter((b) => b.petType.id === selectedTypeId);

  const openStepper = () => {
    setStep(0);
    setSelectedTypeId(null);
    setSelectedBreedId(null);
    setFormDeviceSerial('');
    setFormDeviceLookup(null);
    setFormDeviceId(null);
    setFormName('');
    setFormBirthDate('');
    setDeviceLookupError('');
    setShowStepper(true);
  };

  const closeStepper = () => {
    setShowStepper(false);
    setSaving(false);
  };

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

  const handleCreate = async () => {
    if (!formName.trim() || selectedBreedId == null || formDeviceId == null) return;
    setSaving(true);
    try {
      await apiClient.post('/v1/api/zootag/client/pets', {
        name: formName.trim(),
        breedId: selectedBreedId,
        serialNumber: formDeviceSerial.trim(),
        ...(formBirthDate && { birthDate: formBirthDate }),
      });
      showSuccess('پت با موفقیت ثبت شد');
      closeStepper();
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
            onClick={openStepper}
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

        {/* Stepper modal */}
        {showStepper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl dark:bg-zinc-900">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">افزودن پت جدید</h3>
                <button onClick={closeStepper} disabled={saving} className="rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Steps indicator */}
              <div className="mb-6 flex items-center gap-1">
                {steps.map((label, i) => (
                  <div key={i} className="flex items-center gap-1 flex-1">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      i === step
                        ? 'bg-primary text-white'
                        : i < step
                          ? 'bg-success/10 text-success'
                          : 'bg-zinc-100 text-muted dark:bg-zinc-800'
                    }`}>
                      {i < step ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-xs ${i === step ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-muted'}`}>
                      {label}
                    </span>
                    {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-success' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="min-h-[260px]">
                {/* Step 1 — Pet type */}
                {step === 0 && (
                  <div>
                    <p className="mb-4 text-sm text-muted">نوع حیوان خود را انتخاب کنید:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {petTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => { setSelectedTypeId(type.id); setStep(1); }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all ${
                            selectedTypeId === type.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <span className="text-3xl">{type.id === 1 ? '🐕' : '🐈'}</span>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2 — Breed */}
                {step === 1 && (
                  <div>
                    <p className="mb-4 text-sm text-muted">نژاد {petTypes.find((t) => t.id === selectedTypeId)?.name} را انتخاب کنید:</p>
                    {filteredBreeds.length === 0 ? (
                      <p className="text-sm text-muted text-center py-8">هیچ نژادی یافت نشد</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                        {filteredBreeds.map((breed) => (
                          <button
                            key={breed.id}
                            onClick={() => { setSelectedBreedId(breed.id); setStep(2); }}
                            className={`rounded-lg border px-3 py-2.5 text-sm text-right transition-all ${
                              selectedBreedId === breed.id
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border text-zinc-900 hover:border-primary/50 dark:text-zinc-100'
                            }`}
                          >
                            {breed.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setStep(0)} className="mt-3 text-xs text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                      → بازگشت به انتخاب نوع
                    </button>
                  </div>
                )}

                {/* Step 3 — Device */}
                {step === 2 && (
                  <div>
                    <p className="mb-4 text-sm text-muted">شماره سریال دستگاه ردیاب را وارد کنید:</p>
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
                        {deviceLookupLoading ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : 'بررسی'}
                      </button>
                    </div>
                    {deviceLookupLoading && <p className="mt-2 text-xs text-muted">در حال بررسی...</p>}
                    {deviceLookupError && <p className="mt-2 text-xs text-danger">{deviceLookupError}</p>}
                    {formDeviceLookup && formDeviceLookup.available && formDeviceLookup.id > 0 && (
                      <div className="mt-3 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
                        <p className="text-xs text-success font-medium">✓ دستگاه تأیید شد</p>
                        <p className="mt-0.5 text-xs text-muted">{formDeviceLookup.serialNumber} — {formDeviceLookup.deviceTypeName ?? ''} {formDeviceLookup.modelCode ?? ''}</p>
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setStep(1)} className="text-xs text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        → بازگشت به انتخاب نژاد
                      </button>
                      {formDeviceId && (
                        <button onClick={() => setStep(3)} className="mr-auto text-xs text-primary hover:text-primary-hover font-medium transition-colors">
                          ادامه →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4 — Info */}
                {step === 3 && (
                  <div>
                    <p className="mb-4 text-sm text-muted">اطلاعات پت را وارد کنید:</p>
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
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">تاریخ تولد</label>
                        <input
                          type="date"
                          value={formBirthDate}
                          onChange={(e) => setFormBirthDate(e.target.value)}
                          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <button onClick={() => setStep(2)} className="text-xs text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        → بازگشت به دستگاه
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={saving || !formName.trim()}
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
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
