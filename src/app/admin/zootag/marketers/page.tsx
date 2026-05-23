'use client';

import { useState, useEffect } from 'react';
import { DataTable, CrudModal, ConfirmDialog, Badge } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

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

const modalFields: FieldDef[] = [
  { name: 'fullName', label: 'نام کامل', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'نام بازاریاب را وارد کنید' },
  { name: 'mobile', label: 'موبایل', type: 'string', placeholder: '09123456789' },
  { name: 'email', label: 'ایمیل', type: 'string', placeholder: 'example@email.com' },
  { name: 'nationalCode', label: 'کد ملی', type: 'string', placeholder: 'کد ملی' },
  { name: 'defaultCommissionTypeId', label: 'نوع کمیسیون پیش‌فرض', type: 'string' },
  { name: 'defaultCommissionValue', label: 'مقدار کمیسیون پیش‌فرض', type: 'number', placeholder: 'مثلاً 10' },
];

export default function MarketersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Marketer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Marketer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedCommissionTypeId, setSelectedCommissionTypeId] = useState<number | null>(null);
  const [commissionTypeOptions, setCommissionTypeOptions] = useState<{ value: number; label: string }[]>([]);

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
      if (e instanceof ApiError) alert(e.message);
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
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setDeleting(false);
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

  return (
    <div>
      <button
        onClick={handleCreate}
        className="mb-4 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        افزودن بازاریاب
      </button>
      <DataTable
        key={refreshKey}
        columns={columns}
        apiEndpoint="/v1/api/zootag/admin/marketers"
        title="بازاریاب‌ها"
        description="مدیریت بازاریاب‌ها و فروشندگان"
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
    </div>
  );
}
