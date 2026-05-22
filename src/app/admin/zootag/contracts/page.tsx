'use client';

import { useState, useEffect, useRef } from 'react';

import { DataTable, CrudModal, ConfirmDialog, LookupDialog } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Contract {
  id: number;
  companyId: number;
  contractNumber: string;
  title: string;
  startDate: string;
  endDate: string;
  currencyId: number;
  contractStatusId: number;
  notes?: string;
  isActive: boolean;
  company?: { id: number; companyName: string };
  currency?: { id: number; code: string; name: string; symbol: string };
  contractStatus?: { id: number; name: string };
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
  formFields: [
    { name: 'code', label: 'کد', type: 'string', required: true },
    { name: 'name', label: 'نام', type: 'string', required: true },
    { name: 'symbol', label: 'نماد', type: 'string', required: true },
  ],
};

const modalFields: FieldDef[] = [
  { name: 'contractNumber', label: 'شماره قرارداد', type: 'string', required: true, minLength: 1, maxLength: 100, placeholder: 'شماره قرارداد را وارد کنید' },
  { name: 'title', label: 'عنوان', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'عنوان قرارداد را وارد کنید' },
  { name: 'startDate', label: 'تاریخ شروع', type: 'date', required: true },
  { name: 'endDate', label: 'تاریخ پایان', type: 'date', required: true },
  { name: 'notes', label: 'توضیحات', type: 'textarea', placeholder: 'توضیحات (اختیاری)' },
  { name: 'companyId', label: 'شرکت', type: 'string', required: true },
  { name: 'currencyId', label: 'ارز', type: 'string', required: true },
  { name: 'contractStatusId', label: 'وضعیت', type: 'string', required: true },
];

export default function ContractsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [selectedCurrencyName, setSelectedCurrencyName] = useState('');
  const [selectedContractStatusId, setSelectedContractStatusId] = useState<number | null>(null);
  const [_selectedContractStatusName, setSelectedContractStatusName] = useState('');
  const [contractStatusOptions, setContractStatusOptions] = useState<{ value: number; label: string }[]>([]);
  const [lookupConfig, setLookupConfig] = useState<LookupConfig | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);

  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/contractStatuses');
        setContractStatusOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setContractStatusOptions([]);
      }
    })();
  }, [modalOpen]);

  const handleCreate = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName('');
    setSelectedCurrencyId(null);
    setSelectedCurrencyName('');
    setSelectedContractStatusId(null);
    setSelectedContractStatusName('');
    setContractStatusOptions([]);
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Contract) => {
    setSelectedCompanyId(row.companyId);
    setSelectedCompanyName(row.company?.companyName ?? '');
    setSelectedCurrencyId(row.currencyId);
    setSelectedCurrencyName(row.currency?.name ?? '');
    setSelectedContractStatusId(row.contractStatusId);
    setSelectedContractStatusName(row.contractStatus?.name ?? '');
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
        currencyId: selectedCurrencyId,
        contractStatusId: selectedContractStatusId,
      };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/contracts', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/contracts/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/zootag/admin/contracts/${deleteTarget.id}`);
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
    _error?: string,
  ) => {
    if (field.name === 'companyId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
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
        </div>
      );
    }

    if (field.name === 'currencyId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              value={selectedCurrencyName}
              disabled
              placeholder="ارز را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                setLookupConfig(currencyLookupConfig);
                pendingOnChangeRef.current = onChange;
                setLookupOpen(true);
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
        </div>
      );
    }

    if (field.name === 'contractStatusId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <select
            value={selectedContractStatusId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              const option = contractStatusOptions.find((o) => o.value === id);
              setSelectedContractStatusId(id);
              setSelectedContractStatusName(option?.label ?? '');
              onChange(id);
            }}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
          >
            <option value="">انتخاب وضعیت...</option>
            {contractStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  const columns: Column<Contract>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'contractNumber', header: 'شماره قرارداد' },
    { key: 'title', header: 'عنوان' },
    { key: 'startDate', header: 'تاریخ شروع' },
    { key: 'endDate', header: 'تاریخ پایان' },
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
        apiEndpoint="/v1/api/zootag/admin/contracts"
        title="قراردادها"
        description="مدیریت قراردادها"
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن قرارداد' : 'ویرایش قرارداد'}
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
            lookupConfig.title === 'شرکت' ? selectedCompanyId : selectedCurrencyId
          }
          onSelect={(value, label) => {
            if (pendingOnChangeRef.current) {
              pendingOnChangeRef.current(value);
              pendingOnChangeRef.current = null;
            }
            if (lookupConfig.title === 'شرکت') {
              setSelectedCompanyId(value as number);
              setSelectedCompanyName(label);
            } else if (lookupConfig.title === 'ارز') {
              setSelectedCurrencyId(value as number);
              setSelectedCurrencyName(label);
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
        message="آیا از حذف این قرارداد اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
