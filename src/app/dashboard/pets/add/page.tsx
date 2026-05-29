'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';
import { getErrorMessage } from '@/lib/error-handler';
import { apiClient } from '@/lib/api-client';
import { PersianDatePicker } from '@/components/ui';

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

export default function AddPetPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const { showError, showSuccess } = useNotification();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Step 2
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [selectedBreedId, setSelectedBreedId] = useState<number | null>(null);

  // Step 3
  const [formDeviceSerial, setFormDeviceSerial] = useState('');
  const [deviceLookupLoading, setDeviceLookupLoading] = useState(false);
  const [deviceLookupError, setDeviceLookupError] = useState('');
  const [formDeviceLookup, setFormDeviceLookup] = useState<DeviceLookupResult | null>(null);
  const [formDeviceId, setFormDeviceId] = useState<number | null>(null);

  // Step 4
  const [formName, setFormName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthDateIso, setBirthDateIso] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      refreshSession().then((res) => {
        if (!res) router.push('/login');
      });
      return;
    }
    if (!isAuthenticated) return;
    apiClient.get<PetType[]>('/v1/api/zootag/client/petTypes', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setPetTypes(result))
      .catch(() => {});
    apiClient.get<Breed[]>('/v1/api/zootag/client/petBreeds', { limit: 100, offset: 0, ignorePaging: true })
      .then(({ result }) => setBreeds(result))
      .catch(() => {});
  }, [isAuthenticated, isLoading, refreshSession, router]);

  const filteredBreeds = breeds.filter((b) => b.petType.id === selectedTypeId);

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
        ...(birthDateIso && { birthDate: birthDateIso }),
      });
      showSuccess('پت با موفقیت ثبت شد');
      router.push('/dashboard/pets');
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => router.push('/dashboard/pets');

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
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">زوتگ</a>
            <span className="text-xs text-muted">/</span>
            <a href="/dashboard/pets" className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">پت‌های من</a>
            <span className="text-xs text-muted">/</span>
            <span className="text-sm text-muted">افزودن</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">افزودن پت جدید</h2>
          <p className="mt-0.5 text-sm text-muted">مراحل زیر را به ترتیب تکمیل کنید</p>
        </div>

        {/* Steps indicator */}
        <div className="mb-8 flex items-center gap-1">
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
                ) : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-muted'}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-success' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Pet type */}
        {step === 0 && (
          <div className="rounded-xl border border-border bg-white p-6 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-muted">نوع حیوان خود را انتخاب کنید:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {petTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedTypeId(type.id); setStep(1); }}
                  className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                    selectedTypeId === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-4xl">{type.id === 1 ? '🐕' : '🐈'}</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{type.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-start">
              <button onClick={cancel} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">انصراف</button>
            </div>
          </div>
        )}

        {/* Step 2 — Breed */}
        {step === 1 && (
          <div className="rounded-xl border border-border bg-white p-6 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-muted">
              نژاد <span className="font-medium text-zinc-900 dark:text-zinc-100">{petTypes.find((t) => t.id === selectedTypeId)?.name}</span> را انتخاب کنید:
            </p>
            {filteredBreeds.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted">هیچ نژادی یافت نشد</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredBreeds.map((breed) => (
                  <button
                    key={breed.id}
                    onClick={() => { setSelectedBreedId(breed.id); setStep(2); }}
                    className={`rounded-lg border px-4 py-3 text-sm text-right transition-all ${
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
            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => setStep(0)} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">→ مرحله قبل</button>
              <button onClick={cancel} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">انصراف</button>
            </div>
          </div>
        )}

        {/* Step 3 — Device */}
        {step === 2 && (
          <div className="rounded-xl border border-border bg-white p-6 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-muted">شماره سریال دستگاه ردیاب را وارد کنید:</p>
            <div className="flex gap-2">
              <input
                value={formDeviceSerial}
                onChange={(e) => { setFormDeviceSerial(e.target.value); setFormDeviceLookup(null); setFormDeviceId(null); setDeviceLookupError(''); }}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                placeholder="شماره سریال را وارد کنید"
              />
              <button
                onClick={handleDeviceLookup}
                disabled={deviceLookupLoading || !formDeviceSerial.trim()}
                className="flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {deviceLookupLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : 'بررسی'}
              </button>
            </div>
            {deviceLookupLoading && <p className="mt-2 text-xs text-muted">در حال بررسی...</p>}
            {deviceLookupError && <p className="mt-2 text-xs text-danger">{deviceLookupError}</p>}
            {formDeviceLookup && formDeviceLookup.available && formDeviceLookup.id > 0 && (
              <div className="mt-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                <p className="text-xs text-success font-medium">✓ دستگاه تأیید شد</p>
                <p className="mt-0.5 text-xs text-muted">{formDeviceLookup.serialNumber} — {formDeviceLookup.deviceTypeName ?? ''} {formDeviceLookup.modelCode ?? ''}</p>
              </div>
            )}
            <div className="mt-6 flex items-center gap-4">
              <button onClick={() => setStep(1)} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">→ مرحله قبل</button>
              {formDeviceId && (
                <button onClick={() => setStep(3)} className="mr-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                  ادامه
                </button>
              )}
              <button onClick={cancel} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">انصراف</button>
            </div>
          </div>
        )}

        {/* Step 4 — Info */}
        {step === 3 && (
          <div className="rounded-xl border border-border bg-white p-6 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-muted">اطلاعات پت را وارد کنید:</p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">نام پت <span className="text-danger">*</span></label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100"
                  placeholder="نام پت را وارد کنید"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">تاریخ تولد</label>
                <PersianDatePicker
                  value={birthDate}
                  onChange={(val) => {
                    setBirthDate(val.isoDate ? new Date(val.isoDate) : null);
                    setBirthDateIso(val.isoDate);
                  }}
                  placeholder="تاریخ تولد را انتخاب کنید"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(2)} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">→ مرحله قبل</button>
                <button onClick={cancel} className="text-sm text-muted hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">انصراف</button>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving || !formName.trim()}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
      </main>
    </div>
  );
}
