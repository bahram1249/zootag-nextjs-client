'use client';

import { useRef, useState } from 'react';

import { DataTable, CrudModal, ConfirmDialog, LookupDialog } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface DeviceType {
  id: number;
  typeName: string;
  modelCode: string;
  description?: string;
  isActive: boolean;
  manufacturerId: number;
  manufacturer?: { id: number; manufacturerName: string };
}

const modalFields: FieldDef[] = [
  { name: 'typeName', label: 'نام نوع', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'نام نوع را وارد کنید' },
  { name: 'modelCode', label: 'کد مدل', type: 'string', required: true, placeholder: 'کد مدل را وارد کنید' },
  { name: 'manufacturerId', label: 'سازنده', type: 'number', required: true },
  { name: 'description', label: 'توضیحات', type: 'textarea', placeholder: 'توضیحات (اختیاری)' },
];

const manufacturerLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/manufacturers',
  labelKey: 'manufacturerName',
  valueKey: 'id',
  title: 'سازنده',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'manufacturerName', header: 'نام سازنده' },
  ],
  formFields: [
    { name: 'manufacturerName', label: 'نام سازنده', type: 'string', required: true },
  ],
};

export default function DeviceTypesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<DeviceType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeviceType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedManufacturerId, setSelectedManufacturerId] = useState<number | null>(null);
  const [selectedManufacturerName, setSelectedManufacturerName] = useState('');
  const [lookupOpen, setLookupOpen] = useState(false);
  const manufacturerOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setSelectedManufacturerId(null);
    setSelectedManufacturerName('');
    setModalOpen(true);
  };

  const handleEdit = (row: DeviceType) => {
    setModalMode('edit');
    setSelected(row);
    setSelectedManufacturerId(row.manufacturerId);
    setSelectedManufacturerName(row.manufacturer?.manufacturerName ?? '');
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        typeName: values.typeName,
        modelCode: values.modelCode,
        description: values.description,
        manufacturerId: selectedManufacturerId,
      };

      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/deviceTypes', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/deviceTypes/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/zootag/admin/deviceTypes/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderCustomField = (field: FieldDef, value: unknown, onChange: (v: unknown) => void, error?: string) => {
    if (field.name !== 'manufacturerId') return null;

    manufacturerOnChangeRef.current = onChange;

    return (
      <div key={field.name}>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {field.label}
          {field.required && <span className="mr-0.5 text-danger">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={selectedManufacturerName}
            disabled
            className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary disabled:opacity-60 dark:text-zinc-100"
            placeholder="سازنده را انتخاب کنید"
          />
          <button
            type="button"
            onClick={() => setLookupOpen(true)}
            className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            انتخاب
          </button>
          {selectedManufacturerId != null && (
            <button
              type="button"
              onClick={() => {
                setSelectedManufacturerId(null);
                setSelectedManufacturerName('');
                manufacturerOnChangeRef.current?.(null);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  };

  const columns: Column<DeviceType>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'typeName', header: 'نام نوع' },
    { key: 'modelCode', header: 'کد مدل' },
    { key: 'description', header: 'توضیحات' },
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
        apiEndpoint="/v1/api/zootag/admin/deviceTypes"
        title="انواع دستگاه"
        description="مدیریت انواع دستگاه"
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن نوع دستگاه' : 'ویرایش نوع دستگاه'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />
      <LookupDialog
        open={lookupOpen}
        config={manufacturerLookupConfig}
        selectedValue={selectedManufacturerId}
        onSelect={(value, label) => {
          const id = Number(value);
          setSelectedManufacturerId(id);
          setSelectedManufacturerName(label);
          manufacturerOnChangeRef.current?.(id);
        }}
        onClose={() => setLookupOpen(false)}
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
