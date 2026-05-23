'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, CrudModal, LookupDialog, Badge } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';

interface DeviceSale {
  id: number;
  deviceId: number;
  marketerId: number;
  customerCompanyId?: number;
  saleDate: string;
  salePrice: number;
  saleCurrencyId: number;
  salePriceIRR: number;
  purchasePriceIRR: number;
  grossProfitIRR: number;
  commissionTypeId?: number;
  commissionType?: { id: number; name: string };
  commissionValue: number;
  commissionAmountIRR: number;
  netProfitIRR: number;
  notes?: string;
  device?: { id: number; serialNumber: string; imei?: string };
  marketer?: { id: number; fullName: string };
  customerCompany?: { id: number; companyName: string };
  saleCurrency?: { id: number; code: string; name: string; symbol: string };
  createdUser?: { id: number; firstname: string; lastname: string };
}

const deviceLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/devices',
  labelKey: 'serialNumber',
  valueKey: 'id',
  title: 'دستگاه',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'serialNumber', header: 'سریال نمبر' },
    { key: 'imei', header: 'IMEI' },
  ],
  formFields: [],
};

const marketerLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/marketers',
  labelKey: 'fullName',
  valueKey: 'id',
  title: 'بازاریاب',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'fullName', header: 'نام کامل' },
    { key: 'mobile', header: 'موبایل' },
  ],
  formFields: [],
};

const currencyLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/currencies',
  labelKey: 'name',
  valueKey: 'id',
  title: 'ارز',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'code', header: 'کد' },
    { key: 'name', header: 'نام' },
    { key: 'symbol', header: 'نماد' },
  ],
  formFields: [],
};

const modalFields: FieldDef[] = [
  { name: 'deviceId', label: 'دستگاه', type: 'string', required: true },
  { name: 'marketerId', label: 'بازاریاب', type: 'string', required: true },
  { name: 'saleDate', label: 'تاریخ فروش', type: 'date', required: true },
  { name: 'salePrice', label: 'قیمت فروش', type: 'number', required: true },
  { name: 'saleCurrencyId', label: 'ارز فروش', type: 'string', required: true },
  { name: 'commissionTypeId', label: 'نوع کمیسیون', type: 'string', placeholder: 'اختیاری' },
  { name: 'commissionValue', label: 'مقدار کمیسیون', type: 'number', placeholder: 'اختیاری' },
  { name: 'notes', label: 'یادداشت', type: 'string', placeholder: 'اختیاری' },
];

export default function DeviceSalesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState('');
  const [selectedMarketerId, setSelectedMarketerId] = useState<number | null>(null);
  const [selectedMarketerName, setSelectedMarketerName] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [selectedCurrencyName, setSelectedCurrencyName] = useState('');

  const [deviceLookupOpen, setDeviceLookupOpen] = useState(false);
  const [marketerLookupOpen, setMarketerLookupOpen] = useState(false);
  const [currencyLookupOpen, setCurrencyLookupOpen] = useState(false);
  const [selectedCommissionTypeId, setSelectedCommissionTypeId] = useState<number | null>(null);
  const [commissionTypeOptions, setCommissionTypeOptions] = useState<{ value: number; label: string }[]>([]);
  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);
  const lookupFieldRef = useRef<string>('');

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/commissionTypes');
        setCommissionTypeOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setCommissionTypeOptions([]);
      }
    })();
  }, [modalOpen]);

  const handleCreate = () => {
    setSelectedDeviceId(null);
    setSelectedDeviceName('');
    setSelectedMarketerId(null);
    setSelectedMarketerName('');
    setSelectedCurrencyId(null);
    setSelectedCurrencyName('');
    setSelectedCommissionTypeId(null);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        deviceId: selectedDeviceId,
        marketerId: selectedMarketerId,
        saleCurrencyId: selectedCurrencyId,
        commissionTypeId: selectedCommissionTypeId,
      };
      await apiClient.post('/v1/api/zootag/admin/deviceSales', payload);
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderCustomField = (
    field: FieldDef,
    _value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'deviceId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedDeviceName}
              disabled
              placeholder="دستگاه را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { lookupFieldRef.current = 'device'; pendingOnChangeRef.current = onChange; setDeviceLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedDeviceId != null && (
              <button
                type="button"
                onClick={() => { setSelectedDeviceId(null); setSelectedDeviceName(''); onChange(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
              >
                ×
              </button>
            )}
          </div>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    if (field.name === 'marketerId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedMarketerName}
              disabled
              placeholder="بازاریاب را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { lookupFieldRef.current = 'marketer'; pendingOnChangeRef.current = onChange; setMarketerLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedMarketerId != null && (
              <button
                type="button"
                onClick={() => { setSelectedMarketerId(null); setSelectedMarketerName(''); onChange(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
              >
                ×
              </button>
            )}
          </div>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    if (field.name === 'commissionTypeId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <select
            value={selectedCommissionTypeId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setSelectedCommissionTypeId(id);
              onChange(id);
            }}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">بدون مقدار (پیش‌فرض بازاریاب)</option>
            {commissionTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    if (field.name === 'saleCurrencyId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedCurrencyName}
              disabled
              placeholder="ارز فروش را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { lookupFieldRef.current = 'currency'; pendingOnChangeRef.current = onChange; setCurrencyLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedCurrencyId != null && (
              <button
                type="button"
                onClick={() => { setSelectedCurrencyId(null); setSelectedCurrencyName(''); onChange(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
              >
                ×
              </button>
            )}
          </div>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    return null;
  };

  const columns: Column<DeviceSale>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'device',
      header: 'دستگاه',
      render: (v) => (v as { serialNumber?: string } | undefined)?.serialNumber ?? '',
    },
    {
      key: 'marketer',
      header: 'بازاریاب',
      render: (v) => (v as { fullName?: string } | undefined)?.fullName ?? '',
    },
    { key: 'saleDate', header: 'تاریخ فروش', render: (v) => formatPersianDate(v) },
    { key: 'salePrice', header: 'قیمت فروش', render: (v) => formatPrice(v) },
    { key: 'salePriceIRR', header: 'فروش (ریال)', render: (v) => formatPrice(v) },
    {
      key: 'commissionType',
      header: 'نوع کمیسیون',
      render: (v) => {
        const ct = v as { id: number; name: string } | undefined;
        return ct ? <Badge variant="info" size="sm">{ct.name}</Badge> : <span className="text-muted">—</span>;
      },
    },
    { key: 'grossProfitIRR', header: 'سود ناخالص', render: (v) => formatPrice(v) },
    { key: 'commissionAmountIRR', header: 'کمیسیون', render: (v) => formatPrice(v) },
    { key: 'netProfitIRR', header: 'سود خالص', render: (v) => formatPrice(v) },
  ];

  return (
    <div>
      <button
        onClick={handleCreate}
        className="mb-4 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        ثبت فروش جدید
      </button>
      <DataTable
        key={refreshKey}
        columns={columns}
        apiEndpoint="/v1/api/zootag/admin/deviceSales"
        title="فروش دستگاه‌ها"
        description="مدیریت فروش دستگاه‌ها (غیرقابل ویرایش)"
      />
      <CrudModal
        open={modalOpen}
        mode="create"
        title="ثبت فروش دستگاه"
        fields={modalFields}
        initialValues={{}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />
      <LookupDialog
        open={deviceLookupOpen}
        config={deviceLookupConfig}
        selectedValue={selectedDeviceId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedDeviceId(value as number);
          setSelectedDeviceName(label);
          setDeviceLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setDeviceLookupOpen(false); }}
      />
      <LookupDialog
        open={marketerLookupOpen}
        config={marketerLookupConfig}
        selectedValue={selectedMarketerId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedMarketerId(value as number);
          setSelectedMarketerName(label);
          setMarketerLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setMarketerLookupOpen(false); }}
      />
      <LookupDialog
        open={currencyLookupOpen}
        config={currencyLookupConfig}
        selectedValue={selectedCurrencyId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedCurrencyId(value as number);
          setSelectedCurrencyName(label);
          setCurrencyLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setCurrencyLookupOpen(false); }}
      />
    </div>
  );
}
