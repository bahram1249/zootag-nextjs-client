'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, CrudModal, ConfirmDialog, LookupDialog, Badge } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';

interface Device {
  id: number;
  serialNumber: string;
  imei?: string;
  macAddress?: string;
  companyId: number;
  deviceTypeId: number;
  contractPeriodId: number;
  contractPeriodDevicePriceId: number;
  purchaseDate?: string;
  warrantyEndDate: string;
  deviceStatusId: number;
  isActive: boolean;
  company?: { id: number; companyName: string };
  deviceType?: { id: number; typeName: string; modelCode: string };
  deviceStatus?: { id: number; name: string };
  contractPeriod?: { id: number; periodName: string };
  contractPeriodDevicePrice?: { id: number; purchasePrice: number };
  currencyId: number;
  currency?: { id: number; code: string; name: string; symbol: string };
  inventoryStatusId?: number;
  inventoryStatus?: { id: number; name: string };
  saleId?: number;
  sale?: { id: number; salePrice: number };
}

const contractPeriodDevicePriceLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/contractPeriodDevicePrices/available',
  labelKey: 'displayName',
  valueKey: 'id',
  title: 'قیمت دوره قرارداد',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'contractPeriod', header: 'دوره', render: (v: unknown) => (v as { periodName?: string })?.periodName ?? '' },
    { key: 'deviceType', header: 'نوع دستگاه', render: (v: unknown) => {
      const dt = v as { typeName?: string; modelCode?: string } | undefined;
      return dt ? `${dt.typeName ?? ''} (${dt.modelCode ?? ''})` : '';
    }},
    { key: 'companyDisplay', header: 'شرکت', render: (_v: unknown, row: unknown) => {
      const r = row as { contractPeriod?: { contract?: { company?: { companyName?: string } } } };
      return r?.contractPeriod?.contract?.company?.companyName ?? '';
    }},
    { key: 'purchasePrice', header: 'قیمت خرید', render: (v) => formatPrice(v) },
    { key: 'maximumQuantity', header: 'حداکثر تعداد', render: (v) => formatPrice(v) },
  ],
  formFields: [],
};

const modalFields: FieldDef[] = [
  { name: 'serialNumber', label: 'سریال نمبر', type: 'string', required: true, minLength: 1, maxLength: 100, placeholder: 'سریال نمبر را وارد کنید' },
  { name: 'imei', label: 'IMEI', type: 'string', placeholder: 'IMEI (اختیاری)' },
  { name: 'macAddress', label: 'MAC Address', type: 'string', placeholder: 'MAC Address (اختیاری)' },
  { name: 'purchaseDate', label: 'تاریخ خرید', type: 'date' },
  { name: 'warrantyEndDate', label: 'تاریخ پایان گارانتی', type: 'date', required: true },
  { name: 'contractPeriodDevicePriceId', label: 'قیمت دوره قرارداد', type: 'string', required: true },
  { name: 'deviceStatusId', label: 'وضعیت دستگاه', type: 'string', required: true },
];

export default function DevicesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Device | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [selectedPriceDisplay, setSelectedPriceDisplay] = useState('');
  const [selectedDeviceStatusId, setSelectedDeviceStatusId] = useState<number | null>(null);
  const [selectedDeviceStatusName, setSelectedDeviceStatusName] = useState('');
  const [deviceStatusOptions, setDeviceStatusOptions] = useState<{ value: number; label: string }[]>([]);
  const [lookupOpen, setLookupOpen] = useState(false);
  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/deviceStatuses');
        setDeviceStatusOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setDeviceStatusOptions([]);
      }
    })();
  }, [modalOpen]);

  const handleCreate = () => {
    setSelectedPriceId(null);
    setSelectedPriceDisplay('');
    setSelectedDeviceStatusId(null);
    setSelectedDeviceStatusName('');
    setDeviceStatusOptions([]);
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Device) => {
    const contractDesc = `${row.contractPeriod?.periodName ?? ''} - ${row.deviceType?.typeName ?? ''} (${row.deviceType?.modelCode ?? ''})`;
    setSelectedPriceId(row.contractPeriodDevicePriceId);
    setSelectedPriceDisplay(contractDesc);
    setSelectedDeviceStatusId(row.deviceStatusId);
    setSelectedDeviceStatusName(row.deviceStatus?.name ?? '');
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        contractPeriodDevicePriceId: selectedPriceId,
        deviceStatusId: selectedDeviceStatusId,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/devices', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/devices/${selected!.id}`, payload);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/v1/api/zootag/admin/devices/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderCustomField = (
    field: FieldDef,
    value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'contractPeriodDevicePriceId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} {field.required && <span className="text-danger">*</span>}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
                error ? 'border-danger' : 'border-border'
              }`}
              value={selectedPriceDisplay}
              disabled
              placeholder="قیمت دوره قرارداد را انتخاب کنید"
            />
            <button
              type="button"
              disabled={modalMode === 'edit'}
              onClick={() => {
                pendingOnChangeRef.current = onChange;
                setLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              انتخاب
            </button>
            {selectedPriceId != null && modalMode === 'create' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPriceId(null);
                  setSelectedPriceDisplay('');
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

    if (field.name === 'deviceStatusId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} {field.required && <span className="text-danger">*</span>}
          </label>
          <select
            value={selectedDeviceStatusId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              const option = deviceStatusOptions.find((o) => o.value === id);
              setSelectedDeviceStatusId(id);
              setSelectedDeviceStatusName(option?.label ?? '');
              onChange(id);
            }}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">انتخاب وضعیت...</option>
            {deviceStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    return null;
  };

  const columns: Column<Device>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'serialNumber', header: 'سریال نمبر' },
    { key: 'imei', header: 'IMEI' },
    { key: 'macAddress', header: 'MAC Address' },
    {
      key: 'company',
      header: 'شرکت',
      render: (v) => (v as { companyName?: string } | undefined)?.companyName ?? '',
    },
    {
      key: 'deviceType',
      header: 'نوع دستگاه',
      render: (v) => {
        const dt = v as { typeName?: string; modelCode?: string } | undefined;
        return dt ? `${dt.typeName ?? ''} (${dt.modelCode ?? ''})` : '';
      },
    },
    {
      key: 'contractPeriod',
      header: 'دوره قرارداد',
      render: (v) => (v as { periodName?: string } | undefined)?.periodName ?? '',
    },
    {
      key: 'deviceStatus',
      header: 'وضعیت',
      render: (v, row) => {
        const status = v as { id?: number; name?: string } | undefined;
        const id = (row as Device).deviceStatusId;
        const label = status?.name ?? '';
        const map: Record<number, { variant: 'success' | 'info' | 'primary' | 'danger' | 'warning'; icon: React.ReactNode }> = {
          1: { variant: 'success', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
          2: { variant: 'info', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          3: { variant: 'primary', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          4: { variant: 'danger', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> },
          5: { variant: 'warning', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-4-4" /></svg> },
        };
        const cfg = map[id];
        return cfg ? <Badge variant={cfg.variant} icon={cfg.icon} size="sm">{label}</Badge> : <Badge size="sm">{label}</Badge>;
      },
    },
    {
      key: 'inventoryStatus',
      header: 'وضعیت انبار',
      render: (v, row) => {
        const inv = v as { id?: number; name?: string } | undefined;
        const r = row as Device;
        const id = r.inventoryStatusId;
        const label = inv?.name ?? '';
        const map: Record<number, { variant: 'success' | 'info' | 'primary' | 'warning' | 'danger'; icon: React.ReactNode }> = {
          1: { variant: 'success', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
          2: { variant: 'info', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          3: { variant: 'primary', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          4: { variant: 'warning', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> },
          5: { variant: 'danger', icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-4-4" /></svg> },
        };
        const cfg = map[id ?? 0];
        return cfg ? <Badge variant={cfg.variant} icon={cfg.icon} size="sm">{label}</Badge> : <Badge size="sm">{label}</Badge>;
      },
    },
    {
      key: 'sale',
      header: 'فروش',
      render: (v, row) => {
        const sale = v as { id?: number; salePrice?: number } | undefined;
        const r = row as Device;
        if (!r.saleId) return <span className="text-muted">—</span>;
        return (
          <Badge variant="primary" size="sm" icon={
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }>
            {sale ? `${sale.id} (${formatPrice(sale.salePrice)})` : `#${r.saleId}`}
          </Badge>
        );
      },
    },
    { key: 'purchaseDate', header: 'تاریخ خرید', render: (v) => formatPersianDate(v) },
    { key: 'warrantyEndDate', header: 'پایان گارانتی', render: (v) => formatPersianDate(v) },
    { key: 'purchasePrice', header: 'قیمت خرید', render: (v) => formatPrice(v) },
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
    {
      key: 'actions',
      header: 'عملیات',
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="ویرایش"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={() => setDeleteTarget(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="حذف"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
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
        افزودن
      </button>
      <DataTable
        key={refreshKey}
        columns={columns}
        apiEndpoint="/v1/api/zootag/admin/devices"
        title="دستگاه‌ها"
        description="مدیریت دستگاه‌ها"
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن دستگاه' : 'ویرایش دستگاه'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />
      <LookupDialog
        open={lookupOpen}
        config={contractPeriodDevicePriceLookupConfig}
        selectedValue={selectedPriceId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedPriceId(value as number);
          setSelectedPriceDisplay(label);
          setLookupOpen(false);
        }}
        onClose={() => {
          pendingOnChangeRef.current = null;
          setLookupOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این دستگاه اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
}
