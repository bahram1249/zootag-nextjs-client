'use client';

import { useState } from 'react';

import { DataTable, CrudModal, ConfirmDialog } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRateToIRR: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

const modalFields: FieldDef[] = [
  { name: 'code', label: 'کد', type: 'string', required: true, minLength: 2, maxLength: 10, placeholder: 'مثال: USD' },
  { name: 'name', label: 'نام', type: 'string', required: true, minLength: 2, maxLength: 100, placeholder: 'مثال: دلار آمریکا' },
  { name: 'symbol', label: 'نماد', type: 'string', required: true, minLength: 1, maxLength: 20, placeholder: 'مثال: $' },
  { name: 'exchangeRateToIRR', label: 'نرخ برابری به ریال', type: 'number', placeholder: 'مثال: 750000' },
  { name: 'isBaseCurrency', label: 'ارز پایه', type: 'boolean' },
];

export default function CurrenciesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Currency | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Currency) => {
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/currencies', values);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/currencies/${selected!.id}`, values);
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
      await apiClient.delete(`/v1/api/zootag/admin/currencies/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Currency>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'code', header: 'کد' },
    { key: 'name', header: 'نام' },
    { key: 'symbol', header: 'نماد' },
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
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
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
        apiEndpoint="/v1/api/zootag/admin/currencies"
        title="ارزها"
        description="مدیریت ارزها"
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن ارز' : 'ویرایش ارز'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این آیتم اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
