'use client';

import { useState } from 'react';

import { DataTable, CrudModal, ConfirmDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface PetType {
  id: number;
  name: string;
  isActive: boolean;
}

const modalFields: FieldDef[] = [
  { name: 'id', label: 'شناسه', type: 'number', required: true, placeholder: 'شناسه را وارد کنید' },
  { name: 'name', label: 'نام', type: 'string', required: true, minLength: 2, maxLength: 50, placeholder: 'نام نوع پت را وارد کنید' },
  { name: 'isActive', label: 'فعال', type: 'boolean' },
];

export default function PetTypesPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<PetType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PetType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: PetType) => {
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        id: Number(values.id),
        name: values.name,
        isActive: values.isActive,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/petTypes', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/petTypes/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/zootag/admin/petTypes/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<PetType>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'name', header: 'نام' },
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
      <PageHeader
        variant="card"
        title="انواع پت"
        description="مدیریت انواع پت"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'انواع پت' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن نوع پت',
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
        apiEndpoint="/v1/api/zootag/admin/petTypes"
        title="انواع پت"
        description="مدیریت انواع پت"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن نوع پت' : 'ویرایش نوع پت'}
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
