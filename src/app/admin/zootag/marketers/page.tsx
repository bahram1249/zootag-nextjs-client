'use client';

import { useState, useEffect } from 'react';
import { DataTable, CrudModal, ConfirmDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatPersianDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface Marketer {
  id: number;
  fullName: string;
  mobile?: string;
  email?: string;
  nationalCode?: string;
  defaultCommissionTypeId?: number;
  defaultCommissionType?: { id: number; name: string };
  defaultCommissionValue?: number;
  isActive: boolean;
}

interface MarketerCommission {
  id: number;
  marketerId: number;
  commissionTypeId: number;
  commissionValue: number;
  startDate: string;
  endDate?: string;
  priority: number;
  isActive: boolean;
  commissionType?: { id: number; name: string };
}

const modalFields: FieldDef[] = [
  { name: 'fullName', label: 'نام کامل', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'نام بازاریاب را وارد کنید' },
  { name: 'mobile', label: 'موبایل', type: 'string', placeholder: '09123456789' },
  { name: 'email', label: 'ایمیل', type: 'string', placeholder: 'example@email.com' },
  { name: 'nationalCode', label: 'کد ملی', type: 'string', placeholder: 'کد ملی' },
  { name: 'defaultCommissionTypeId', label: 'نوع کمیسیون پیش‌فرض', type: 'string' },
  { name: 'defaultCommissionValue', label: 'مقدار کمیسیون پیش‌فرض', type: 'number', placeholder: 'مثلاً 10' },
];

const commissionModalFields: FieldDef[] = [
  { name: 'commissionTypeId', label: 'نوع کمیسیون', type: 'string', required: true },
  { name: 'commissionValue', label: 'مقدار کمیسیون', type: 'number', required: true, placeholder: 'مثلاً 10' },
  { name: 'startDate', label: 'تاریخ شروع', type: 'date', required: true },
  { name: 'endDate', label: 'تاریخ پایان', type: 'date' },
  { name: 'priority', label: 'اولویت', type: 'number', placeholder: 'عدد کمتر = اولویت بالاتر' },
];

export default function MarketersPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Marketer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Marketer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedCommissionTypeId, setSelectedCommissionTypeId] = useState<number | null>(null);
  const [commissionTypeOptions, setCommissionTypeOptions] = useState<{ value: number; label: string }[]>([]);

  // Commission nested CRUD
  const [commissionsMarketer, setCommissionsMarketer] = useState<Marketer | null>(null);
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [commModalMode, setCommModalMode] = useState<'create' | 'edit'>('create');
  const [selectedComm, setSelectedComm] = useState<MarketerCommission | null>(null);
  const [commSaving, setCommSaving] = useState(false);
  const [commDeleteTarget, setCommDeleteTarget] = useState<MarketerCommission | null>(null);
  const [commDeleting, setCommDeleting] = useState(false);
  const [commRefreshKey, setCommRefreshKey] = useState(0);
  const [selectedCommTypeId, setSelectedCommTypeId] = useState<number | null>(null);
  const [commTypeOptions, setCommTypeOptions] = useState<{ value: number; label: string }[]>([]);

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

  useEffect(() => {
    if (!commModalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/commissionTypes');
        setCommTypeOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setCommTypeOptions([]);
      }
    })();
  }, [commModalOpen]);

  const handleCreate = () => {
    setSelectedCommissionTypeId(null);
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Marketer) => {
    setSelectedCommissionTypeId(row.defaultCommissionTypeId ?? null);
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        defaultCommissionTypeId: selectedCommissionTypeId,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/marketers', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/marketers/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/zootag/admin/marketers/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  // Commission handlers
  const handleCommCreate = () => {
    setSelectedCommTypeId(null);
    setCommModalMode('create');
    setSelectedComm(null);
    setCommModalOpen(true);
  };

  const handleCommEdit = (row: MarketerCommission) => {
    setSelectedCommTypeId(row.commissionTypeId);
    setCommModalMode('edit');
    setSelectedComm(row);
    setCommModalOpen(true);
  };

  const handleCommSave = async (values: Record<string, unknown>) => {
    if (!commissionsMarketer) return;
    setCommSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        commissionTypeId: selectedCommTypeId,
      };
      const baseUrl = `/v1/api/zootag/admin/marketers/${commissionsMarketer.id}/commissions`;
      if (commModalMode === 'create') {
        await apiClient.post(baseUrl, payload);
      } else {
        await apiClient.put(`${baseUrl}/${selectedComm!.id}`, payload);
      }
      setCommModalOpen(false);
      setCommRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setCommSaving(false);
    }
  };

  const handleCommDelete = async () => {
    if (!commDeleteTarget || !commissionsMarketer) return;
    setCommDeleting(true);
    try {
      await apiClient.delete(`/v1/api/zootag/admin/marketers/${commissionsMarketer.id}/commissions/${commDeleteTarget.id}`);
      setCommDeleteTarget(null);
      setCommRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setCommDeleting(false);
    }
  };

  const columns: Column<Marketer>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'fullName', header: 'نام کامل' },
    { key: 'mobile', header: 'موبایل' },
    { key: 'email', header: 'ایمیل' },
    { key: 'nationalCode', header: 'کد ملی' },
    {
      key: 'defaultCommissionType',
      header: 'نوع کمیسیون',
      render: (v) => {
        const ct = v as { id: number; name: string } | undefined;
        return ct ? <Badge variant="info" size="sm">{ct.name}</Badge> : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'defaultCommissionValue',
      header: 'مقدار کمیسیون',
      render: (v) => (v != null ? String(v) : '—'),
    },
    {
      key: 'isActive',
      header: 'فعال',
      render: (v) =>
        v ? (
          <Badge variant="success" size="sm" icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>فعال</Badge>
        ) : (
          <Badge variant="danger" size="sm" icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}>غیرفعال</Badge>
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
            onClick={() => setCommissionsMarketer(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="کمیسیون‌ها"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const commissionColumns: Column<MarketerCommission>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'commissionType',
      header: 'نوع کمیسیون',
      render: (v) => {
        const ct = v as { name?: string } | undefined;
        return ct?.name ?? '';
      },
    },
    { key: 'commissionValue', header: 'مقدار', render: (v) => String(v) },
    { key: 'startDate', header: 'تاریخ شروع', render: (v) => formatPersianDate(v) },
    { key: 'endDate', header: 'تاریخ پایان', render: (v) => (v ? formatPersianDate(v) : '—') },
    { key: 'priority', header: 'اولویت' },
    {
      key: 'isActive',
      header: 'فعال',
      render: (v) =>
        v ? <Badge variant="success" size="sm" icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}>فعال</Badge> : <Badge variant="danger" size="sm" icon={<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}>غیرفعال</Badge>,
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCommEdit(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="ویرایش"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setCommDeleteTarget(row)}
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

  const renderCustomField = (
    field: FieldDef,
    _value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'defaultCommissionTypeId') {
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
            <option value="">انتخاب نوع کمیسیون...</option>
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
    return null;
  };

  const renderCommCustomField = (
    field: FieldDef,
    _value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'commissionTypeId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} <span className="text-danger">*</span>
          </label>
          <select
            value={selectedCommTypeId ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setSelectedCommTypeId(id);
              onChange(id);
            }}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">انتخاب نوع کمیسیون...</option>
            {commTypeOptions.map((opt) => (
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

  return (
    <div>
      <PageHeader
        variant="card"
        title="بازاریاب‌ها"
        description="مدیریت بازاریاب‌ها و فروشندگان"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'بازاریاب‌ها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن بازاریاب',
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
        apiEndpoint="/v1/api/zootag/admin/marketers"
        title="بازاریاب‌ها"
        description="مدیریت بازاریاب‌ها و فروشندگان"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن بازاریاب' : 'ویرایش بازاریاب'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این بازاریاب اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Commissions Modal */}
      {commissionsMarketer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setCommissionsMarketer(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-5xl overflow-auto rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                کمیسیون‌های {commissionsMarketer.fullName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCommCreate}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  افزودن کمیسیون
                </button>
                <button
                  onClick={() => setCommissionsMarketer(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <DataTable
              key={commRefreshKey}
              columns={commissionColumns}
              apiEndpoint={`/v1/api/zootag/admin/marketers/${commissionsMarketer.id}/commissions`}
              title=""
              description=""
            />
          </div>
        </div>
      )}

      {/* Commission CrudModal */}
      <CrudModal
        open={commModalOpen}
        mode={commModalMode}
        title={commModalMode === 'create' ? 'افزودن کمیسیون' : 'ویرایش کمیسیون'}
        fields={commissionModalFields}
        initialValues={selectedComm ?? {}}
        loading={commSaving}
        onSave={handleCommSave}
        onClose={() => setCommModalOpen(false)}
        renderCustomField={renderCommCustomField}
      />

      {/* Commission ConfirmDialog */}
      <ConfirmDialog
        open={!!commDeleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این کمیسیون اطمینان دارید؟"
        loading={commDeleting}
        onConfirm={handleCommDelete}
        onCancel={() => setCommDeleteTarget(null)}
      />
    </div>
  );
}
