'use client';

import { useState, useRef } from 'react';
import { DataTable, CrudModal, LookupDialog, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';

interface DeviceSalePrice {
  id: number;
  deviceTypeId: number;
  companyId?: number;
  contractPeriodId?: number;
  currencyId: number;
  salePrice: number;
  salePriceIRR: number;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  deviceType?: { id: number; typeName: string; modelCode: string };
  company?: { id: number; companyName: string };
  contractPeriod?: { id: number; periodName: string };
  currency?: { id: number; code: string; name: string; symbol: string };
}

const deviceTypeLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/deviceTypes',
  labelKey: 'typeName',
  valueKey: 'id',
  title: 'نوع دستگاه',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'typeName', header: 'نام نوع' },
    { key: 'modelCode', header: 'کد مدل' },
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
  { name: 'deviceTypeId', label: 'نوع دستگاه', type: 'string', required: true },
  { name: 'currencyId', label: 'ارز', type: 'string', required: true },
  { name: 'salePrice', label: 'قیمت فروش', type: 'price', required: true },
  { name: 'validFrom', label: 'تاریخ شروع اعتبار', type: 'date', required: true },
  { name: 'validTo', label: 'تاریخ پایان اعتبار', type: 'date' },
];

export default function DeviceSalePricesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedDeviceTypeName, setSelectedDeviceTypeName] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [selectedCurrencyName, setSelectedCurrencyName] = useState('');

  const [deviceTypeLookupOpen, setDeviceTypeLookupOpen] = useState(false);
  const [currencyLookupOpen, setCurrencyLookupOpen] = useState(false);
  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  const handleCreate = () => {
    setSelectedDeviceTypeId(null);
    setSelectedDeviceTypeName('');
    setSelectedCurrencyId(null);
    setSelectedCurrencyName('');
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        deviceTypeId: selectedDeviceTypeId,
        currencyId: selectedCurrencyId,
      };
      await apiClient.post('/v1/api/zootag/admin/deviceSalePrices', payload);
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
    if (field.name === 'deviceTypeId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedDeviceTypeName}
              disabled
              placeholder="نوع دستگاه را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { pendingOnChangeRef.current = onChange; setDeviceTypeLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedDeviceTypeId != null && (
              <button
                type="button"
                onClick={() => { setSelectedDeviceTypeId(null); setSelectedDeviceTypeName(''); onChange(null); }}
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

    if (field.name === 'currencyId') {
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
              placeholder="ارز را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { pendingOnChangeRef.current = onChange; setCurrencyLookupOpen(true); }}
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

  const columns: Column<DeviceSalePrice>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'deviceType',
      header: 'نوع دستگاه',
      render: (v) => {
        const dt = v as { typeName?: string; modelCode?: string } | undefined;
        return dt ? `${dt.typeName ?? ''} (${dt.modelCode ?? ''})` : '';
      },
    },
    {
      key: 'company',
      header: 'شرکت',
      render: (v) => (v as { companyName?: string } | undefined)?.companyName ?? '—',
    },
    {
      key: 'currency',
      header: 'ارز',
      render: (v) => (v as { symbol?: string } | undefined)?.symbol ?? '',
    },
    { key: 'salePrice', header: 'قیمت فروش', render: (v) => formatPrice(v) },
    { key: 'salePriceIRR', header: 'قیمت فروش (ریال)', render: (v) => formatPrice(v) },
    { key: 'validFrom', header: 'اعتبار از', render: (v) => formatPersianDate(v) },
    { key: 'validTo', header: 'اعتبار تا', render: (v) => (v ? formatPersianDate(v) : '—') },
    {
      key: 'isActive',
      header: 'فعال',
      render: (v) =>
        v ? (
          <span className="text-success font-medium">فعال</span>
        ) : (
          <span className="text-muted">غیرفعال</span>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        variant="card"
        title="قیمت‌های فروش دستگاه"
        description="مدیریت قیمت‌های فروش (تاریخچه ضمیمه‌شونده)"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'قیمت‌های فروش' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن قیمت فروش',
              icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
              variant: 'primary',
              onClick: handleCreate,
            },
          ]}
        />
      </PageHeader>
      <DataTable
        key={refreshKey}
        columns={columns}
        apiEndpoint="/v1/api/zootag/admin/deviceSalePrices"
        title="قیمت‌های فروش دستگاه"
        description="مدیریت قیمت‌های فروش (تاریخچه ضمیمه‌شونده)"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode="create"
        title="افزودن قیمت فروش"
        fields={modalFields}
        initialValues={{}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />
      <LookupDialog
        open={deviceTypeLookupOpen}
        config={deviceTypeLookupConfig}
        selectedValue={selectedDeviceTypeId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedDeviceTypeId(value as number);
          setSelectedDeviceTypeName(label);
          setDeviceTypeLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setDeviceTypeLookupOpen(false); }}
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
