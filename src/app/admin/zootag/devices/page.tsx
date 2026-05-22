'use client';

import { useState, useEffect, useRef } from 'react';

import { DataTable, CrudModal, ConfirmDialog, LookupDialog } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Device {
  id: number;
  serialNumber: string;
  imei?: string;
  macAddress?: string;
  companyId: number;
  deviceTypeId: number;
  purchaseDate?: string;
  warrantyEndDate: string;
  deviceStatusId: number;
  isActive: boolean;
  company?: { id: number; companyName: string };
  deviceType?: { id: number; typeName: string; modelCode: string };
  deviceStatus?: { id: number; name: string };
}

const companyLookupConfig: LookupConfig = {
  endpoint: '/v1/api/zootag/admin/companies',
  labelKey: 'companyName',
  valueKey: 'id',
  title: 'شرکت',
  columns: [
    { key: 'id', header: 'شناسه' },
    { key: 'companyName', header: 'نام شرکت' },
  ],
  formFields: [
    { name: 'companyName', label: 'نام شرکت', type: 'string', required: true },
    { name: 'legalName', label: 'نام حقوقی', type: 'string', required: true },
  ],
};

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
  formFields: [
    { name: 'typeName', label: 'نام نوع', type: 'string', required: true },
    { name: 'modelCode', label: 'کد مدل', type: 'string', required: true },
  ],
};

const modalFields: FieldDef[] = [
  { name: 'serialNumber', label: 'سریال نمبر', type: 'string', required: true, minLength: 1, maxLength: 100, placeholder: 'سریال نمبر را وارد کنید' },
  { name: 'imei', label: 'IMEI', type: 'string', placeholder: 'IMEI (اختیاری)' },
  { name: 'macAddress', label: 'MAC Address', type: 'string', placeholder: 'MAC Address (اختیاری)' },
  { name: 'purchaseDate', label: 'تاریخ خرید', type: 'date' },
  { name: 'warrantyEndDate', label: 'تاریخ پایان گارانتی', type: 'date', required: true },
  { name: 'companyId', label: 'شرکت', type: 'string', required: true },
  { name: 'deviceTypeId', label: 'نوع دستگاه', type: 'string', required: true },
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

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedDeviceTypeName, setSelectedDeviceTypeName] = useState('');
  const [selectedDeviceStatusId, setSelectedDeviceStatusId] = useState<number | null>(null);
  const [selectedDeviceStatusName, setSelectedDeviceStatusName] = useState('');
  const [deviceStatusOptions, setDeviceStatusOptions] = useState<{ value: number; label: string }[]>([]);
  const [lookupConfig, setLookupConfig] = useState<LookupConfig | null>(null);
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
    setSelectedCompanyId(null);
    setSelectedCompanyName('');
    setSelectedDeviceTypeId(null);
    setSelectedDeviceTypeName('');
    setSelectedDeviceStatusId(null);
    setSelectedDeviceStatusName('');
    setDeviceStatusOptions([]);
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Device) => {
    setSelectedCompanyId(row.companyId);
    setSelectedCompanyName(row.company?.companyName ?? '');
    setSelectedDeviceTypeId(row.deviceTypeId);
    setSelectedDeviceTypeName(row.deviceType?.typeName ?? '');
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
        companyId: selectedCompanyId,
        deviceTypeId: selectedDeviceTypeId,
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
    if (field.name === 'companyId') {
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
              value={selectedCompanyName}
              disabled
              placeholder="شرکت را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                setLookupConfig(companyLookupConfig);
                pendingOnChangeRef.current = onChange;
                setLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedCompanyId != null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCompanyId(null);
                  setSelectedCompanyName('');
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

    if (field.name === 'deviceTypeId') {
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
              value={selectedDeviceTypeName}
              disabled
              placeholder="نوع دستگاه را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                setLookupConfig(deviceTypeLookupConfig);
                pendingOnChangeRef.current = onChange;
                setLookupOpen(true);
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
      {lookupConfig && (
        <LookupDialog
          open={lookupOpen}
          config={lookupConfig}
          selectedValue={
            lookupConfig.title === 'شرکت' ? selectedCompanyId : selectedDeviceTypeId
          }
          onSelect={(value, label) => {
            if (pendingOnChangeRef.current) {
              pendingOnChangeRef.current(value);
              pendingOnChangeRef.current = null;
            }
            if (lookupConfig.title === 'شرکت') {
              setSelectedCompanyId(value as number);
              setSelectedCompanyName(label);
            } else if (lookupConfig.title === 'نوع دستگاه') {
              setSelectedDeviceTypeId(value as number);
              setSelectedDeviceTypeName(label);
            }
            setLookupOpen(false);
          }}
          onClose={() => {
            pendingOnChangeRef.current = null;
            setLookupOpen(false);
          }}
        />
      )}
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
