'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, CrudModal, LookupDialog, Badge, PersianDatePicker, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface DeviceSale {
  id: number;
  deviceId: number;
  marketerId?: number;
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

interface SalePreview {
  salePrice: number;
  saleCurrencyId: number;
  salePriceIRR: number;
  purchasePriceIRR: number;
  grossProfitIRR: number;
  commissionTypeId: number;
  commissionType?: { id: number; name: string };
  commissionValue: number;
  commissionAmountIRR: number;
  netProfitIRR: number;
}

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

const deviceLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/devices/available',
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

const modalFields: FieldDef[] = [
  { name: 'marketerId', label: 'بازاریاب', type: 'string' },
  { name: 'deviceId', label: 'دستگاه', type: 'string', required: true },
  { name: 'deviceSalePriceId', label: 'قیمت فروش', type: 'string', required: true },
  { name: 'saleDate', label: 'تاریخ فروش', type: 'date', required: true },
  { name: 'notes', label: 'یادداشت', type: 'string', placeholder: 'اختیاری' },
];

export default function DeviceSalesPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedMarketerId, setSelectedMarketerId] = useState<number | null>(null);
  const [selectedMarketerName, setSelectedMarketerName] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState('');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedDeviceSalePriceId, setSelectedDeviceSalePriceId] = useState<number | null>(null);
  const [selectedDeviceSalePriceLabel, setSelectedDeviceSalePriceLabel] = useState('');
  const [selectedSaleDate, setSelectedSaleDate] = useState<string>('');
  const [saleDateError, setSaleDateError] = useState<string>('');

  const [preview, setPreview] = useState<SalePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [marketerLookupOpen, setMarketerLookupOpen] = useState(false);
  const [deviceLookupOpen, setDeviceLookupOpen] = useState(false);
  const [priceLookupOpen, setPriceLookupOpen] = useState(false);
  const [priceLookupConfig, setPriceLookupConfig] = useState<LookupConfig | null>(null);
  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);
  const lookupFieldRef = useRef<string>('');

  useEffect(() => {
    if (!modalOpen) {
      setPreview(null);
      setSelectedSaleDate('');
      setSaleDateError('');
    }
  }, [modalOpen]);

  useEffect(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    if (!selectedDeviceId || !selectedDeviceSalePriceId || !selectedSaleDate) {
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    previewTimerRef.current = setTimeout(async () => {
      try {
        const params: Record<string, string> = {
          deviceId: String(selectedDeviceId),
          deviceSalePriceId: String(selectedDeviceSalePriceId),
          saleDate: selectedSaleDate,
        };
        if (selectedMarketerId) {
          params.marketerId = String(selectedMarketerId);
        }
        const qs = new URLSearchParams(params);
        const { result } = await apiClient.get<SalePreview>(
          `/v1/api/zootag/admin/deviceSales/preview?${qs}`,
        );
        setPreview(result);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, [selectedDeviceId, selectedDeviceSalePriceId, selectedMarketerId, selectedSaleDate]);

  const handleCreate = () => {
    setSelectedMarketerId(null);
    setSelectedMarketerName('');
    setSelectedDeviceId(null);
    setSelectedDeviceName('');
    setSelectedDeviceTypeId(null);
    setSelectedDeviceSalePriceId(null);
    setSelectedDeviceSalePriceLabel('');
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        deviceId: selectedDeviceId,
        deviceSalePriceId: selectedDeviceSalePriceId,
        marketerId: selectedMarketerId,
      };
      if (!payload.marketerId) delete payload.marketerId;
      await apiClient.post('/v1/api/zootag/admin/deviceSales', payload);
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const openPriceLookup = (onChange: (v: unknown) => void) => {
    if (!selectedDeviceTypeId) {
      alert('لطفا ابتدا دستگاه را انتخاب کنید');
      return;
    }
    pendingOnChangeRef.current = onChange;
    lookupFieldRef.current = 'deviceSalePriceId';
    let endpoint = `/v1/api/zootag/admin/deviceSalePrices/effective?deviceTypeId=${selectedDeviceTypeId}`;
    if (selectedMarketerId) {
      endpoint += `&marketerId=${selectedMarketerId}`;
    }
    setPriceLookupConfig({
      endpoint,
      labelKey: 'salePrice',
      valueKey: 'id',
      title: 'قیمت فروش',
      columns: [
        { key: 'id', header: 'شناسه' },
        { key: 'salePrice', header: 'قیمت', render: (v) => formatPrice(v) },
        { key: 'currency', header: 'ارز', render: (v) => (v as { code?: string })?.code ?? '' },
        {
          key: 'priceType',
          header: 'نوع قیمت',
          render: (v) =>
            v === 'marketer' ? (
              <Badge variant="warning" size="sm">بازاریاب</Badge>
            ) : (
              <Badge variant="default" size="sm">پیش‌فرض</Badge>
            ),
        },
      ],
      formFields: [],
    });
    setPriceLookupOpen(true);
  };

  const renderCustomField = (
    field: FieldDef,
    _value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'marketerId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedMarketerName}
              disabled
              placeholder="اختیاری - بازاریاب را انتخاب کنید"
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
                onClick={() => { setSelectedDeviceId(null); setSelectedDeviceName(''); setSelectedDeviceTypeId(null); setSelectedDeviceSalePriceId(null); setSelectedDeviceSalePriceLabel(''); onChange(null); }}
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

    if (field.name === 'deviceSalePriceId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedDeviceSalePriceLabel}
              disabled
              placeholder="ابتدا دستگاه را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => openPriceLookup(onChange)}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedDeviceSalePriceId != null && (
              <button
                type="button"
                onClick={() => { setSelectedDeviceSalePriceId(null); setSelectedDeviceSalePriceLabel(''); onChange(null); }}
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

    if (field.name === 'saleDate') {
      return (
        <div key={field.name}>
          <PersianDatePicker
            label={field.label}
            value={selectedSaleDate ? new Date(selectedSaleDate) : null}
            onChange={(v) => {
              setSelectedSaleDate(v.isoDate);
              onChange(v.isoDate);
              setSaleDateError('');
            }}
            error={saleDateError}
            placeholder={field.placeholder}
          />
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
      render: (v) => (v as { fullName?: string } | undefined)?.fullName ?? '—',
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
      <PageHeader
        variant="card"
        title="فروش دستگاه‌ها"
        description="مدیریت فروش دستگاه‌ها (غیرقابل ویرایش)"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'فروش دستگاه‌ها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'ثبت فروش جدید',
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
        apiEndpoint="/v1/api/zootag/admin/deviceSales"
        title="فروش دستگاه‌ها"
        description="مدیریت فروش دستگاه‌ها (غیرقابل ویرایش)"
        hideHeader
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
      >
        {previewLoading && (
          <div className="flex items-center justify-center py-3 text-sm text-muted">
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            در حال محاسبه کمیسیون...
          </div>
        )}
        {!previewLoading && preview && (
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              پیش‌نمایش محاسبات
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">قیمت فروش:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatPrice(preview.salePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">قیمت فروش (ریال):</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatPrice(preview.salePriceIRR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">قیمت خرید (ریال):</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatPrice(preview.purchasePriceIRR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">سود ناخالص:</span>
                <span className="font-medium text-success">{formatPrice(preview.grossProfitIRR)}</span>
              </div>
              {preview.commissionType && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted">نوع کمیسیون:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      <Badge variant="info" size="sm">{preview.commissionType.name}</Badge>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">مقدار کمیسیون:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {preview.commissionTypeId === 1 ? `${preview.commissionValue}%` : formatPrice(preview.commissionValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">مبلغ کمیسیون:</span>
                    <span className="font-medium text-warning">{formatPrice(preview.commissionAmountIRR)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-1">
                <span className="font-semibold text-muted">سود خالص:</span>
                <span className="font-semibold text-primary">{formatPrice(preview.netProfitIRR)}</span>
              </div>
            </div>
          </div>
        )}
      </CrudModal>
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
        open={deviceLookupOpen}
        config={deviceLookupConfig}
        selectedValue={selectedDeviceId}
        onSelect={(value, label, row) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedDeviceId(value as number);
          setSelectedDeviceName(label);
          setSelectedDeviceTypeId(row?.deviceTypeId as number ?? null);
          setDeviceLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setDeviceLookupOpen(false); }}
      />
      {priceLookupConfig && (
        <LookupDialog
          open={priceLookupOpen}
          config={priceLookupConfig}
          selectedValue={selectedDeviceSalePriceId}
          onSelect={(value, label) => {
            if (pendingOnChangeRef.current) {
              pendingOnChangeRef.current(value);
              pendingOnChangeRef.current = null;
            }
            setSelectedDeviceSalePriceId(value as number);
            setSelectedDeviceSalePriceLabel(label);
            setPriceLookupOpen(false);
          }}
          onClose={() => { pendingOnChangeRef.current = null; setPriceLookupOpen(false); }}
        />
      )}
    </div>
  );
}
