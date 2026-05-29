'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, CrudModal, ConfirmDialog, LookupDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface CommissionSettlement {
  id: number;
  marketerId: number;
  deviceSaleId: number;
  amountIRR: number;
  paymentDate: string;
  statusId: number;
  status?: { id: number; name: string };
  notes?: string;
  marketer?: { id: number; fullName: string };
  deviceSale?: { id: number; salePrice: number; salePriceIRR: number };
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

const deviceSaleLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/deviceSales',
  labelKey: 'id',
  valueKey: 'id',
  title: 'فروش دستگاه',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'salePrice', header: 'قیمت فروش', render: (v) => formatPrice(v) },
    { key: 'salePriceIRR', header: 'فروش (ریال)', render: (v) => formatPrice(v) },
  ],
  formFields: [],
};

const modalFields: FieldDef[] = [
  { name: 'marketerId', label: 'بازاریاب', type: 'string', required: true },
  { name: 'deviceSaleId', label: 'فروش دستگاه', type: 'string', required: true },
  { name: 'amountIRR', label: 'مبلغ (ریال)', type: 'price', required: true },
  { name: 'paymentDate', label: 'تاریخ پرداخت', type: 'date', required: true },
  { name: 'statusId', label: 'وضعیت', type: 'string' },
  { name: 'notes', label: 'یادداشت', type: 'string', placeholder: 'اختیاری' },
];

export default function CommissionSettlementsPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<CommissionSettlement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommissionSettlement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedMarketerId, setSelectedMarketerId] = useState<number | null>(null);
  const [selectedMarketerName, setSelectedMarketerName] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [selectedSaleName, setSelectedSaleName] = useState('');

  const [marketerLookupOpen, setMarketerLookupOpen] = useState(false);
  const [saleLookupOpen, setSaleLookupOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [statusOptions, setStatusOptions] = useState<{ value: number; label: string }[]>([]);
  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/commissionSettlementStatuses');
        setStatusOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setStatusOptions([]);
      }
    })();
  }, [modalOpen]);

  const handleCreate = () => {
    setSelectedMarketerId(null);
    setSelectedMarketerName('');
    setSelectedSaleId(null);
    setSelectedSaleName('');
    setSelectedStatusId(null);
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: CommissionSettlement) => {
    setSelectedMarketerId(row.marketerId);
    setSelectedMarketerName(row.marketer?.fullName ?? '');
    setSelectedSaleId(row.deviceSaleId);
    setSelectedSaleName(String(row.deviceSaleId));
    setSelectedStatusId(row.statusId);
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        marketerId: selectedMarketerId,
        deviceSaleId: selectedSaleId,
        statusId: selectedStatusId,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/commissionSettlements', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/commissionSettlements/${selected!.id}`, payload);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/v1/api/zootag/admin/commissionSettlements/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
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
              onClick={() => { pendingOnChangeRef.current = onChange; setMarketerLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {(selectedMarketerId != null) && (
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

    if (field.name === 'statusId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <select
            value={selectedStatusId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setSelectedStatusId(id);
              onChange(id);
            }}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">انتخاب وضعیت...</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    if (field.name === 'deviceSaleId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${error ? 'border-danger' : 'border-border'}`}
              value={selectedSaleName}
              disabled
              placeholder="فروش دستگاه را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => { pendingOnChangeRef.current = onChange; setSaleLookupOpen(true); }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {(selectedSaleId != null) && (
              <button
                type="button"
                onClick={() => { setSelectedSaleId(null); setSelectedSaleName(''); onChange(null); }}
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

  const statusVariant: Record<number, 'success' | 'warning' | 'danger'> = {
    1: 'warning',
    2: 'success',
    3: 'danger',
  };

  const columns: Column<CommissionSettlement>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'marketer',
      header: 'بازاریاب',
      render: (v) => (v as { fullName?: string } | undefined)?.fullName ?? '',
    },
    { key: 'deviceSaleId', header: 'شناسه فروش' },
    { key: 'amountIRR', header: 'مبلغ (ریال)', render: (v) => formatPrice(v) },
    { key: 'paymentDate', header: 'تاریخ پرداخت', render: (v) => formatPersianDate(v) },
    {
      key: 'status',
      header: 'وضعیت',
      render: (v, row) => {
        const s = v as { id?: number; name?: string } | undefined;
        const r = row as CommissionSettlement;
        const id = r.statusId;
        const label = s?.name ?? '';
        return <Badge variant={statusVariant[id] ?? 'default'} size="sm">{label}</Badge>;
      },
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
      <PageHeader
        variant="card"
        title="تسویه کمیسیون‌ها"
        description="مدیریت تسویه کمیسیون بازاریاب‌ها"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تسویه کمیسیون‌ها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن تسویه',
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
        apiEndpoint="/v1/api/zootag/admin/commissionSettlements"
        title="تسویه کمیسیون‌ها"
        description="مدیریت تسویه کمیسیون بازاریاب‌ها"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن تسویه' : 'ویرایش تسویه'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
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
        open={saleLookupOpen}
        config={deviceSaleLookupConfig}
        selectedValue={selectedSaleId}
        onSelect={(value, label) => {
          if (pendingOnChangeRef.current) {
            pendingOnChangeRef.current(value);
            pendingOnChangeRef.current = null;
          }
          setSelectedSaleId(value as number);
          setSelectedSaleName(label);
          setSaleLookupOpen(false);
        }}
        onClose={() => { pendingOnChangeRef.current = null; setSaleLookupOpen(false); }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این تسویه اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
