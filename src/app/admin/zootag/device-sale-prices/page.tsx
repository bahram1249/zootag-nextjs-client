'use client';

import { useState, useRef, useEffect } from 'react';
import { DataTable, CrudModal, LookupDialog, Badge, PageHeader, OperationToolbar, ConfirmDialog } from '@/components/ui';
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

interface MarketerPrice {
  id: number;
  marketerId: number;
  deviceTypeId: number;
  currencyId: number;
  salePrice: number;
  salePriceIRR: number;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  marketer?: { id: number; fullName: string };
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

const modalFields: FieldDef[] = [
  { name: 'deviceTypeId', label: 'نوع دستگاه', type: 'string', required: true },
  { name: 'currencyId', label: 'ارز', type: 'string', required: true },
  { name: 'salePrice', label: 'قیمت فروش', type: 'price', required: true },
  { name: 'validFrom', label: 'تاریخ شروع اعتبار', type: 'date', required: true },
  { name: 'validTo', label: 'تاریخ پایان اعتبار', type: 'date' },
];

const marketerPriceFields: FieldDef[] = [
  { name: 'marketerId', label: 'بازاریاب', type: 'string', required: true },
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

  const [manageMpDialogOpen, setManageMpDialogOpen] = useState(false);
  const [mpDeviceTypeId, setMpDeviceTypeId] = useState<number | null>(null);
  const [mpDeviceTypeName, setMpDeviceTypeName] = useState('');
  const [mpList, setMpList] = useState<MarketerPrice[]>([]);
  const [mpListLoading, setMpListLoading] = useState(false);
  const [mpListRefreshKey, setMpListRefreshKey] = useState(0);

  const [mpAddModalOpen, setMpAddModalOpen] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [mpSelectedMarketerId, setMpSelectedMarketerId] = useState<number | null>(null);
  const [mpSelectedMarketerName, setMpSelectedMarketerName] = useState('');
  const [mpSelectedCurrencyId, setMpSelectedCurrencyId] = useState<number | null>(null);
  const [mpSelectedCurrencyName, setMpSelectedCurrencyName] = useState('');
  const [mpMarketerLookupOpen, setMpMarketerLookupOpen] = useState(false);
  const [mpCurrencyLookupOpen, setMpCurrencyLookupOpen] = useState(false);
  const mpPendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  const [mpDeleteTarget, setMpDeleteTarget] = useState<MarketerPrice | null>(null);
  const [mpDeleting, setMpDeleting] = useState(false);

  useEffect(() => {
    if (!manageMpDialogOpen || mpDeviceTypeId == null) return;
    let cancelled = false;
    setMpListLoading(true);
    apiClient
      .get<MarketerPrice[]>('/v1/api/zootag/admin/marketerDeviceSalePrices', {
        deviceTypeId: mpDeviceTypeId,
        ignorePaging: true,
        limit: 100,
      })
      .then((res) => {
        if (!cancelled) setMpList(res.result ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMpListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [manageMpDialogOpen, mpDeviceTypeId, mpListRefreshKey]);

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

  const handleOpenMarketerPrice = (row: DeviceSalePrice) => {
    setMpDeviceTypeId(row.deviceTypeId);
    setMpDeviceTypeName(
      row.deviceType
        ? `${row.deviceType.typeName} (${row.deviceType.modelCode})`
        : '',
    );
    setManageMpDialogOpen(true);
  };

  const handleOpenMpAdd = () => {
    setMpSelectedMarketerId(null);
    setMpSelectedMarketerName('');
    setMpSelectedCurrencyId(null);
    setMpSelectedCurrencyName('');
    setMpAddModalOpen(true);
  };

  const handleMarketerPriceSave = async (values: Record<string, unknown>) => {
    setMpSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        deviceTypeId: mpDeviceTypeId,
        marketerId: mpSelectedMarketerId,
        currencyId: mpSelectedCurrencyId,
      };
      await apiClient.post(
        '/v1/api/zootag/admin/marketerDeviceSalePrices',
        payload,
      );
      setMpAddModalOpen(false);
      setMpListRefreshKey((k) => k + 1);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setMpSaving(false);
    }
  };

  const handleMpDelete = async () => {
    if (!mpDeleteTarget) return;
    setMpDeleting(true);
    try {
      await apiClient.delete(
        `/v1/api/zootag/admin/marketerDeviceSalePrices/${mpDeleteTarget.id}`,
      );
      setMpDeleteTarget(null);
      setMpListRefreshKey((k) => k + 1);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setMpDeleting(false);
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

  const renderMpCustomField = (
    field: FieldDef,
    _value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
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
              value={mpSelectedMarketerName}
              disabled
              placeholder="بازاریاب را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                mpPendingOnChangeRef.current = onChange;
                setMpMarketerLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {mpSelectedMarketerId != null && (
              <button
                type="button"
                onClick={() => {
                  setMpSelectedMarketerId(null);
                  setMpSelectedMarketerName('');
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
              value={mpSelectedCurrencyName}
              disabled
              placeholder="ارز را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                mpPendingOnChangeRef.current = onChange;
                setMpCurrencyLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {mpSelectedCurrencyId != null && (
              <button
                type="button"
                onClick={() => {
                  setMpSelectedCurrencyId(null);
                  setMpSelectedCurrencyName('');
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
          <div className="flex max-h-[80vh] w-full max-w-4xl flex-col rounded-2xl bg-surface shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                قیمت‌های بازاریاب - {mpDeviceTypeName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenMpAdd}
                  className="flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  افزودن قیمت بازاریاب
                </button>
                <button
                  type="button"
                  onClick={() => setManageMpDialogOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              {mpListLoading ? (
                <div className="flex justify-center py-8 text-sm text-muted">
                  در حال بارگذاری...
                </div>
              ) : mpList.length === 0 ? (
                <div className="flex justify-center py-8 text-sm text-muted">
                  هیچ قیمتی ثبت نشده است
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 font-medium text-muted">شناسه</th>
                        <th className="px-3 py-2 font-medium text-muted">بازاریاب</th>
                        <th className="px-3 py-2 font-medium text-muted">ارز</th>
                        <th className="px-3 py-2 font-medium text-muted">قیمت</th>
                        <th className="px-3 py-2 font-medium text-muted">اعتبار از</th>
                        <th className="px-3 py-2 font-medium text-muted">اعتبار تا</th>
                        <th className="px-3 py-2 font-medium text-muted">فعال</th>
                        <th className="px-3 py-2 font-medium text-muted">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mpList.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border transition-colors hover:bg-surface-secondary"
                        >
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {item.id}
                          </td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {item.marketer?.fullName ?? '—'}
                          </td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {item.currency?.symbol ?? ''}
                          </td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {formatPrice(item.salePrice)}
                          </td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {formatPersianDate(item.validFrom)}
                          </td>
                          <td className="px-3 py-2 text-zinc-900 dark:text-zinc-100">
                            {item.validTo
                              ? formatPersianDate(item.validTo)
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            {item.isActive ? (
                              <Badge variant="success" size="sm">
                                فعال
                              </Badge>
                            ) : (
                              <Badge variant="danger" size="sm">
                                غیرفعال
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => setMpDeleteTarget(item)}
                              className="flex h-7 items-center rounded bg-danger/10 px-2.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
                            >
                              <svg className="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CrudModal
        open={mpAddModalOpen}
        mode="create"
        title={`افزودن قیمت بازاریاب - ${mpDeviceTypeName}`}
        fields={marketerPriceFields}
        initialValues={{}}
        loading={mpSaving}
        onSave={handleMarketerPriceSave}
        onClose={() => setMpAddModalOpen(false)}
        renderCustomField={renderMpCustomField}
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
      <LookupDialog
        open={mpMarketerLookupOpen}
        config={marketerLookupConfig}
        selectedValue={mpSelectedMarketerId}
        onSelect={(value, label) => {
          if (mpPendingOnChangeRef.current) {
            mpPendingOnChangeRef.current(value);
            mpPendingOnChangeRef.current = null;
          }
          setMpSelectedMarketerId(value as number);
          setMpSelectedMarketerName(label);
          setMpMarketerLookupOpen(false);
        }}
        onClose={() => {
          mpPendingOnChangeRef.current = null;
          setMpMarketerLookupOpen(false);
        }}
      />
      <LookupDialog
        open={mpCurrencyLookupOpen}
        config={currencyLookupConfig}
        selectedValue={mpSelectedCurrencyId}
        onSelect={(value, label) => {
          if (mpPendingOnChangeRef.current) {
            mpPendingOnChangeRef.current(value);
            mpPendingOnChangeRef.current = null;
          }
          setMpSelectedCurrencyId(value as number);
          setMpSelectedCurrencyName(label);
          setMpCurrencyLookupOpen(false);
        }}
        onClose={() => {
          mpPendingOnChangeRef.current = null;
          setMpCurrencyLookupOpen(false);
        }}
      />
      <ConfirmDialog
        open={mpDeleteTarget != null}
        title="حذف قیمت بازاریاب"
        message={
          mpDeleteTarget
            ? `آیا از حذف قیمت "${mpDeleteTarget.marketer?.fullName ?? ''}" اطمینان دارید؟`
            : ''
        }
        confirmLabel="حذف"
        loading={mpDeleting}
        onConfirm={handleMpDelete}
        onCancel={() => setMpDeleteTarget(null)}
      />
    </div>
  );
}
