'use client';

import { useState, useEffect } from 'react';

import { DataTable, CrudModal, ConfirmDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface PetBreed {
  id: number;
  name: string;
  petTypeId: number;
  petType?: { id: number; name: string };
  isActive: boolean;
}

const modalFields: FieldDef[] = [
  { name: 'name', label: 'نام نژاد', type: 'string', required: true, minLength: 2, maxLength: 50, placeholder: 'نام نژاد را وارد کنید' },
  { name: 'petTypeId', label: 'نوع پت', type: 'number', required: true },
  { name: 'isActive', label: 'فعال', type: 'boolean' },
];

export default function PetBreedsPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<PetBreed | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PetBreed | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedPetTypeId, setSelectedPetTypeId] = useState<number | null>(null);
  const [petTypeOptions, setPetTypeOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/petTypes');
        setPetTypeOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setPetTypeOptions([]);
      }
    })();
  }, [modalOpen]);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setSelectedPetTypeId(null);
    setModalOpen(true);
  };

  const handleEdit = (row: PetBreed) => {
    setModalMode('edit');
    setSelected(row);
    setSelectedPetTypeId(row.petTypeId);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        petTypeId: selectedPetTypeId,
        isActive: values.isActive,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/petBreeds', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/petBreeds/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/zootag/admin/petBreeds/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const renderCustomField = (field: FieldDef, value: unknown, onChange: (v: unknown) => void, error?: string) => {
    if (field.name !== 'petTypeId') return null;

    return (
      <div key={field.name}>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {field.label}
          {field.required && <span className="mr-0.5 text-danger">*</span>}
        </label>
        <select
          value={selectedPetTypeId ?? ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            setSelectedPetTypeId(id);
            onChange(id);
          }}
          className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:text-zinc-100 ${
            error ? 'border-danger' : 'border-border'
          }`}
        >
          <option value="">انتخاب نوع پت...</option>
          {petTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  };

  const columns: Column<PetBreed>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'name', header: 'نام نژاد' },
    {
      key: 'petType',
      header: 'نوع پت',
      render: (v) => (v as { name?: string } | undefined)?.name ?? '',
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
        title="نژادها"
        description="مدیریت نژادهای پت"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'نژادها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن نژاد',
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
        apiEndpoint="/v1/api/zootag/admin/petBreeds"
        title="نژادها"
        description="مدیریت نژادهای پت"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن نژاد' : 'ویرایش نژاد'}
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
        message="آیا از حذف این آیتم اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
