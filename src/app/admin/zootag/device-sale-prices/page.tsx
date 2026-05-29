'use client';

import { useState, useRef, useEffect } from 'react';
import { DataTable, CrudModal, LookupDialog, Badge, PageHeader, OperationToolbar, Select, PriceInput, Checkbox } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

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

interface Marketer {
  id: number;
  fullName: string;
  mobile?: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface MarketerPrice {
  id: number;
  marketerId: number;
  currencyId: number;
  salePrice: number;
  isActive: boolean;
}

interface MarketerRowData {
  marketerId: number;
  marketerName: string;
  currencyId: number | null;
  salePrice: number | null;
  isActive: boolean;
  hasExisting: boolean;
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
  const { showError } = useNotification();
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

  const [manageMpDialogOpen, setManageMpDialogOpen] = useState(false);
  const [mpDeviceSalePriceId, setMpDeviceSalePriceId] = useState<number | null>(null);
  const [mpDeviceTypeName, setMpDeviceTypeName] = useState('');
  const [mpRows, setMpRows] = useState<MarketerRowData[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [mpSearch, setMpSearch] = useState('');
  const [mpCurrencies, setMpCurrencies] = useState<Currency[]>([]);

  const [mpRefreshKey, setMpRefreshKey] = useState(0);

  useEffect(() => {
    if (!manageMpDialogOpen || mpDeviceSalePriceId == null) return;
    let cancelled = false;
    setMpLoading(true);
    Promise.all([
      apiClient.get<Marketer[]>('/v1/api/zootag/admin/marketers', { ignorePaging: true }),
      apiClient.get<MarketerPrice[]>('/v1/api/zootag/admin/marketerDeviceSalePrices', {
        deviceSalePriceId: mpDeviceSalePriceId,
        ignorePaging: true,
      }),
      apiClient.get<Currency[]>('/v1/api/zootag/admin/currencies', { ignorePaging: true }),
    ])
      .then(([marketersRes, pricesRes, currenciesRes]) => {
        if (cancelled) return;
        const currenciesList = currenciesRes.result ?? [];
        setMpCurrencies(currenciesList);
        const defaultCurrencyId = currenciesList.length > 0 ? currenciesList[0].id : null;
        const priceMap = new Map<number, MarketerPrice>();
        for (const p of pricesRes.result ?? []) {
          priceMap.set(p.marketerId, p);
        }
          const rows: MarketerRowData[] = (marketersRes.result ?? []).map((m) => {
          const existing = priceMap.get(m.id);
          return {
            marketerId: m.id,
            marketerName: m.fullName,
            currencyId: existing?.currencyId ?? defaultCurrencyId,
            salePrice: existing?.salePrice ?? null,
            isActive: existing?.isActive ?? true,
            hasExisting: !!existing,
          };
        });
        setMpRows(rows);
      })
      .catch((e) => { showError(getErrorMessage(e)); })
      .finally(() => {
        if (!cancelled) setMpLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [manageMpDialogOpen, mpDeviceSalePriceId, mpRefreshKey]);

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
      showError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenMarketerPrice = (row: DeviceSalePrice) => {
    setMpDeviceSalePriceId(row.id);
    setMpDeviceTypeName(
      row.deviceType
        ? `${row.deviceType.typeName} (${row.deviceType.modelCode})`
        : '',
    );
    setManageMpDialogOpen(true);
  };

  const updateRow = (marketerId: number, partial: Partial<MarketerRowData>) => {
    setMpRows((prev) =>
      prev.map((r) => (r.marketerId === marketerId ? { ...r, ...partial } : r)),
    );
  };

  const handleBatchSave = async () => {
    const withPrice = mpRows.filter((r) => r.salePrice != null && r.salePrice > 0);
    const withCurrency = mpRows.filter((r) => r.currencyId != null);
    const items = mpRows
      .filter((r) => r.salePrice != null && r.salePrice > 0 && r.currencyId != null)
      .map((r) => ({
        marketerId: r.marketerId,
        currencyId: r.currencyId!,
        salePrice: r.salePrice!,
        isActive: r.isActive,
      }));
    if (items.length === 0) {
      let msg = '';
      if (withPrice.length === 0) msg += 'حداقل یک ردیف با قیمت وارد کنید\n';
      if (withCurrency.length === 0) msg += 'حداقل یک ردیف با ارز انتخاب کنید';
      alert(msg || 'هیچ ردیفی برای ذخیره وجود ندارد');
      return;
    }
    setMpSaving(true);
    try {
      await apiClient.post('/v1/api/zootag/admin/marketerDeviceSalePrices/batch', {
        deviceSalePriceId: mpDeviceSalePriceId!,
        items,
      });
      setMpRefreshKey((k) => k + 1);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setMpSaving(false);
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
              onClick={() => {
                pendingOnChangeRef.current = onChange;
                setDeviceTypeLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedDeviceTypeId != null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDeviceTypeId(null);
                  setSelectedDeviceTypeName('');
                  onChange(null);
                }}
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
              onClick={() => {
                pendingOnChangeRef.current = onChange;
                setCurrencyLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedCurrencyId != null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCurrencyId(null);
                  setSelectedCurrencyName('');
                  onChange(null);
                }}
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
          <Badge
            variant="success"
            size="sm"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            فعال
          </Badge>
        ) : (
          <Badge
            variant="danger"
            size="sm"
            icon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            غیرفعال
          </Badge>
        ),
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (_v, row) => (
        <button
          onClick={() => handleOpenMarketerPrice(row)}
          className="flex h-7 items-center rounded bg-warning/10 px-2.5 text-xs font-medium text-warning transition-colors hover:bg-warning/20"
        >
          قیمت بازاریاب
        </button>
      ),
    },
  ];

  const filteredRows = mpRows.filter((r) =>
    r.marketerName.toLowerCase().includes(mpSearch.toLowerCase()),
  );

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

      {manageMpDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-surface shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                قیمت‌های بازاریاب - {mpDeviceTypeName}
              </h2>
              <button
                type="button"
                onClick={() => setManageMpDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
              >
                ×
              </button>
            </div>

            <div className="border-b border-border px-6 py-3">
              <input
                type="text"
                value={mpSearch}
                onChange={(e) => setMpSearch(e.target.value)}
                placeholder="جستجوی بازاریاب..."
                className="h-9 w-64 rounded-lg border border-border bg-surface px-3 text-sm text-zinc-900 placeholder-muted outline-none transition-colors focus:border-primary dark:text-zinc-100"
              />
            </div>

            <div className="overflow-y-auto p-6">
              {mpLoading ? (
                <div className="flex justify-center py-8 text-sm text-muted">
                  در حال بارگذاری...
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex justify-center py-8 text-sm text-muted">
                  {mpSearch ? 'نتیجه‌ای یافت نشد' : 'هیچ بازاریابی یافت نشد'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-2 font-medium text-muted">بازاریاب</th>
                        <th className="px-2 py-2 font-medium text-muted">ارز</th>
                        <th className="px-2 py-2 font-medium text-muted">قیمت</th>
                        <th className="px-2 py-2 font-medium text-muted">فعال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr
                          key={row.marketerId}
                          className="border-b border-border transition-colors hover:bg-surface-secondary/50"
                        >
                          <td className="whitespace-nowrap px-2 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                            {row.marketerName}
                          </td>
                          <td className="px-2 py-2">
                            <Select
                              value={String(row.currencyId ?? '')}
                              onChange={(e) =>
                                updateRow(row.marketerId, {
                                  currencyId: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              options={mpCurrencies.map((c) => ({
                                value: String(c.id),
                                label: c.symbol || c.code,
                              }))}
                              placeholder=""
                              className="!h-8 !text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <PriceInput
                              value={row.salePrice}
                              onChange={(v) => updateRow(row.marketerId, { salePrice: v })}
                              className="!h-8 !text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Checkbox
                              checked={row.isActive}
                              onChange={(e) =>
                                updateRow(row.marketerId, {
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={() => setManageMpDialogOpen(false)}
                className="flex h-9 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-secondary"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleBatchSave}
                disabled={mpSaving || mpLoading}
                className="flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {mpSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ذخیره...
                  </span>
                ) : (
                  'ذخیره'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
        onClose={() => {
          pendingOnChangeRef.current = null;
          setDeviceTypeLookupOpen(false);
        }}
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
        onClose={() => {
          pendingOnChangeRef.current = null;
          setCurrencyLookupOpen(false);
        }}
      />
    </div>
  );
}
