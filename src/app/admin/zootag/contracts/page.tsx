'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, CrudModal, ConfirmDialog, LookupDialog } from '@/components/ui';
import type { Column, FieldDef, LookupConfig } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatPrice, formatPersianDate } from '@/lib/format';

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

interface ContractPeriod {
  id: number;
  contractId: number;
  periodName: string;
  startDate: string;
  endDate: string;
  contractPeriodStatusId: number;
  notes?: string;
  isActive: boolean;
  contractPeriodStatus?: { id: number; name: string };
}

interface ContractPeriodDevicePrice {
  id: number;
  contractPeriodId: number;
  deviceTypeId: number;
  purchasePrice?: number;
  currencyId: number;
  purchasePriceIRR: number;
  minimumQuantity: number;
  maximumQuantity: number;
  sellingPrice?: number;
  sellingCurrencyId?: number;
  sellingPriceIRR?: number;
  isActive: boolean;
  deviceType?: { id: number; typeName: string; modelCode: string };
  currency?: { id: number; code: string; name: string; symbol: string };
  sellingCurrency?: { id: number; code: string; name: string; symbol: string };
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

const contractModalFields: FieldDef[] = [
  { name: 'contractNumber', label: 'شماره قرارداد', type: 'string', required: true, minLength: 1, maxLength: 100, placeholder: 'شماره قرارداد را وارد کنید' },
  { name: 'title', label: 'عنوان', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'عنوان قرارداد را وارد کنید' },
  { name: 'startDate', label: 'تاریخ شروع', type: 'date', required: true },
  { name: 'endDate', label: 'تاریخ پایان', type: 'date', required: true },
  { name: 'notes', label: 'توضیحات', type: 'textarea', placeholder: 'توضیحات (اختیاری)' },
  { name: 'companyId', label: 'شرکت', type: 'string', required: true },
  { name: 'currencyId', label: 'ارز', type: 'string', required: true },
  { name: 'contractStatusId', label: 'وضعیت', type: 'string', required: true },
];

const periodModalFields: FieldDef[] = [
  { name: 'periodName', label: 'نام دوره', type: 'string', required: true, minLength: 2, maxLength: 200, placeholder: 'نام دوره را وارد کنید' },
  { name: 'startDate', label: 'تاریخ شروع', type: 'date', required: true },
  { name: 'endDate', label: 'تاریخ پایان', type: 'date', required: true },
  { name: 'contractPeriodStatusId', label: 'وضعیت دوره', type: 'string', required: true },
  { name: 'notes', label: 'توضیحات', type: 'textarea', placeholder: 'توضیحات (اختیاری)' },
];

const priceModalFields: FieldDef[] = [
  { name: 'deviceTypeId', label: 'نوع دستگاه', type: 'string', required: true },
  { name: 'purchasePrice', label: 'قیمت خرید', type: 'price', placeholder: 'قیمت خرید (اختیاری)' },
  { name: 'currencyId', label: 'ارز', type: 'string', required: true },
  { name: 'minimumQuantity', label: 'حداقل تعداد', type: 'number', required: true },
  { name: 'maximumQuantity', label: 'حداکثر تعداد', type: 'number', required: true },
  { name: 'sellingPrice', label: 'قیمت فروش', type: 'price', placeholder: 'قیمت فروش (اختیاری)' },
  { name: 'sellingCurrencyId', label: 'ارز فروش', type: 'string', placeholder: 'ارز فروش (اختیاری)' },
  { name: 'notes', label: 'توضیحات', type: 'textarea', placeholder: 'توضیحات (اختیاری)' },
];

export default function ContractsPage() {
  // Contract CRUD
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
  const [selectedContractStatusName, setSelectedContractStatusName] = useState('');
  const [contractStatusOptions, setContractStatusOptions] = useState<{ value: number; label: string }[]>([]);
  const [lookupConfig, setLookupConfig] = useState<LookupConfig | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);

  const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  // Period CRUD
  const [periodsContract, setPeriodsContract] = useState<Contract | null>(null);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodModalMode, setPeriodModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPeriod, setSelectedPeriod] = useState<ContractPeriod | null>(null);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [periodDeleteTarget, setPeriodDeleteTarget] = useState<ContractPeriod | null>(null);
  const [periodDeleting, setPeriodDeleting] = useState(false);
  const [periodRefreshKey, setPeriodRefreshKey] = useState(0);
  const [selectedPeriodStatusId, setSelectedPeriodStatusId] = useState<number | null>(null);
  const [selectedPeriodStatusName, setSelectedPeriodStatusName] = useState('');
  const [periodStatusOptions, setPeriodStatusOptions] = useState<{ value: number; label: string }[]>([]);

  // Price CRUD
  const [pricesPeriod, setPricesPeriod] = useState<ContractPeriod | null>(null);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalMode, setPriceModalMode] = useState<'create' | 'edit'>('create');
  const [selectedPrice, setSelectedPrice] = useState<ContractPeriodDevicePrice | null>(null);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceDeleteTarget, setPriceDeleteTarget] = useState<ContractPeriodDevicePrice | null>(null);
  const [priceDeleting, setPriceDeleting] = useState(false);
  const [priceRefreshKey, setPriceRefreshKey] = useState(0);

  const [priceLookupConfig, setPriceLookupConfig] = useState<LookupConfig | null>(null);
  const [priceLookupOpen, setPriceLookupOpen] = useState(false);
  const [priceLookupTarget, setPriceLookupTarget] = useState<string | null>(null);
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState<number | null>(null);
  const [selectedDeviceTypeName, setSelectedDeviceTypeName] = useState('');
  const [selectedPriceCurrencyId, setSelectedPriceCurrencyId] = useState<number | null>(null);
  const [selectedPriceCurrencyName, setSelectedPriceCurrencyName] = useState('');
  const [selectedSellingCurrencyId, setSelectedSellingCurrencyId] = useState<number | null>(null);
  const [selectedSellingCurrencyName, setSelectedSellingCurrencyName] = useState('');

  const pricePendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

  // Fetch contract statuses
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

  // Fetch period statuses
  useEffect(() => {
    if (!periodModalOpen) return;
    (async () => {
      try {
        const { result } = await apiClient.get<{ id: number; name: string }[]>('/v1/api/zootag/admin/contractPeriodStatuses');
        setPeriodStatusOptions(result.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setPeriodStatusOptions([]);
      }
    })();
  }, [periodModalOpen]);

  // Contract handlers
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

  // Period handlers
  const handlePeriodCreate = () => {
    setSelectedPeriodStatusId(null);
    setSelectedPeriodStatusName('');
    setPeriodStatusOptions([]);
    setPeriodModalMode('create');
    setSelectedPeriod(null);
    setPeriodModalOpen(true);
  };

  const handlePeriodEdit = (row: ContractPeriod) => {
    setSelectedPeriodStatusId(row.contractPeriodStatusId);
    setSelectedPeriodStatusName(row.contractPeriodStatus?.name ?? '');
    setPeriodModalMode('edit');
    setSelectedPeriod(row);
    setPeriodModalOpen(true);
  };

  const handlePeriodSave = async (values: Record<string, unknown>) => {
    if (!periodsContract) return;
    setPeriodSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        contractId: periodsContract.id,
        contractPeriodStatusId: selectedPeriodStatusId,
      };
      if (periodModalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/contractPeriods', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/contractPeriods/${selectedPeriod!.id}`, payload);
      }
      setPeriodModalOpen(false);
      setPeriodRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setPeriodSaving(false);
    }
  };

  const handlePeriodDelete = async () => {
    if (!periodDeleteTarget) return;
    setPeriodDeleting(true);
    try {
      await apiClient.delete(`/v1/api/zootag/admin/contractPeriods/${periodDeleteTarget.id}`);
      setPeriodDeleteTarget(null);
      setPeriodRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setPeriodDeleting(false);
    }
  };

  // Price handlers
  const handlePriceCreate = () => {
    setSelectedDeviceTypeId(null);
    setSelectedDeviceTypeName('');
    setSelectedPriceCurrencyId(null);
    setSelectedPriceCurrencyName('');
    setSelectedSellingCurrencyId(null);
    setSelectedSellingCurrencyName('');
    setPriceModalMode('create');
    setSelectedPrice(null);
    setPriceModalOpen(true);
  };

  const handlePriceEdit = (row: ContractPeriodDevicePrice) => {
    setSelectedDeviceTypeId(row.deviceTypeId);
    setSelectedDeviceTypeName(row.deviceType ? `${row.deviceType.typeName} (${row.deviceType.modelCode})` : '');
    setSelectedPriceCurrencyId(row.currencyId);
    setSelectedPriceCurrencyName(row.currency?.name ?? '');
    setSelectedSellingCurrencyId(row.sellingCurrencyId ?? null);
    setSelectedSellingCurrencyName(row.sellingCurrency?.name ?? '');
    setPriceModalMode('edit');
    setSelectedPrice(row);
    setPriceModalOpen(true);
  };

  const handlePriceSave = async (values: Record<string, unknown>) => {
    if (!pricesPeriod) return;
    setPriceSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...values,
        contractPeriodId: pricesPeriod.id,
        deviceTypeId: selectedDeviceTypeId,
        currencyId: selectedPriceCurrencyId,
        sellingCurrencyId: selectedSellingCurrencyId || null,
      };
      if (priceModalMode === 'create') {
        await apiClient.post('/v1/api/zootag/admin/contractPeriodDevicePrices', payload);
      } else {
        await apiClient.put(`/v1/api/zootag/admin/contractPeriodDevicePrices/${selectedPrice!.id}`, payload);
      }
      setPriceModalOpen(false);
      setPriceRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setPriceSaving(false);
    }
  };

  const handlePriceDelete = async () => {
    if (!priceDeleteTarget) return;
    setPriceDeleting(true);
    try {
      await apiClient.delete(`/v1/api/zootag/admin/contractPeriodDevicePrices/${priceDeleteTarget.id}`);
      setPriceDeleteTarget(null);
      setPriceRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setPriceDeleting(false);
    }
  };

  // Contract renderCustomField
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

    if (field.name === 'currencyId') {
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
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      );
    }

    if (field.name === 'contractStatusId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} {field.required && <span className="text-danger">*</span>}
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
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">انتخاب وضعیت...</option>
            {contractStatusOptions.map((opt) => (
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

  // Period renderCustomField
  const renderPeriodCustomField = (
    field: FieldDef,
    value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
    if (field.name === 'contractPeriodStatusId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label} {field.required && <span className="text-danger">*</span>}
          </label>
          <select
            value={selectedPeriodStatusId ?? ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              const option = periodStatusOptions.find((o) => o.value === id);
              setSelectedPeriodStatusId(id);
              setSelectedPeriodStatusName(option?.label ?? '');
              onChange(id);
            }}
            className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
              error ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">انتخاب وضعیت...</option>
            {periodStatusOptions.map((opt) => (
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

  // Price renderCustomField
  const renderPriceCustomField = (
    field: FieldDef,
    value: unknown,
    onChange: (v: unknown) => void,
    error?: string,
  ) => {
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
                setPriceLookupConfig(deviceTypeLookupConfig);
                pricePendingOnChangeRef.current = onChange;
                setPriceLookupTarget('deviceType');
                setPriceLookupOpen(true);
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

    if (field.name === 'currencyId') {
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
              value={selectedPriceCurrencyName}
              disabled
              placeholder="ارز را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                setPriceLookupConfig(currencyLookupConfig);
                pricePendingOnChangeRef.current = onChange;
                setPriceLookupTarget('priceCurrency');
                setPriceLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedPriceCurrencyId != null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPriceCurrencyId(null);
                  setSelectedPriceCurrencyName('');
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

    if (field.name === 'sellingCurrencyId') {
      return (
        <div key={field.name}>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`flex-1 rounded-lg border bg-surface px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ${
                error ? 'border-danger' : 'border-border'
              }`}
              value={selectedSellingCurrencyName}
              disabled
              placeholder="ارز فروش را انتخاب کنید"
            />
            <button
              type="button"
              onClick={() => {
                setPriceLookupConfig(currencyLookupConfig);
                pricePendingOnChangeRef.current = onChange;
                setPriceLookupTarget('sellingCurrency');
                setPriceLookupOpen(true);
              }}
              className="flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              انتخاب
            </button>
            {selectedSellingCurrencyId != null && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSellingCurrencyId(null);
                  setSelectedSellingCurrencyName('');
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

    return null;
  };

  // Contract columns
  const columns: Column<Contract>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'contractNumber', header: 'شماره قرارداد' },
    { key: 'title', header: 'عنوان' },
    { key: 'startDate', header: 'تاریخ شروع', render: (v) => formatPersianDate(v) },
    { key: 'endDate', header: 'تاریخ پایان', render: (v) => formatPersianDate(v) },
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
            onClick={() => setPeriodsContract(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="دوره‌ها"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

  // Period columns
  const periodColumns: Column<ContractPeriod>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'periodName', header: 'نام دوره' },
    { key: 'startDate', header: 'تاریخ شروع', render: (v) => formatPersianDate(v) },
    { key: 'endDate', header: 'تاریخ پایان', render: (v) => formatPersianDate(v) },
    {
      key: 'contractPeriodStatus',
      header: 'وضعیت',
      render: (v) => (v as { name?: string } | undefined)?.name ?? '',
    },
    {
      key: 'isActive',
      header: 'فعال',
      render: (v) =>
        v ? <span className="text-success font-medium">فعال</span> : <span className="text-muted">غیرفعال</span>,
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePeriodEdit(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="ویرایش"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setPricesPeriod(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="قیمت‌ها"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setPeriodDeleteTarget(row)}
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

  // Price columns
  const priceColumns: Column<ContractPeriodDevicePrice>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'deviceType',
      header: 'نوع دستگاه',
      render: (v) => {
        const dt = v as { typeName?: string; modelCode?: string } | undefined;
        return dt ? `${dt.typeName ?? ''} (${dt.modelCode ?? ''})` : '';
      },
    },
    { key: 'purchasePrice', header: 'قیمت خرید', render: (v) => formatPrice(v) },
    {
      key: 'currency',
      header: 'ارز',
      render: (v) => (v as { code?: string } | undefined)?.code ?? '',
    },
    { key: 'minimumQuantity', header: 'حداقل تعداد', render: (v) => formatPrice(v) },
    { key: 'maximumQuantity', header: 'حداکثر تعداد', render: (v) => formatPrice(v) },
    { key: 'sellingPrice', header: 'قیمت فروش', render: (v) => formatPrice(v) },
    {
      key: 'sellingCurrency',
      header: 'ارز فروش',
      render: (v) => (v as { code?: string } | undefined)?.code ?? '',
    },
    {
      key: 'isActive',
      header: 'فعال',
      render: (v) =>
        v ? <span className="text-success font-medium">فعال</span> : <span className="text-muted">غیرفعال</span>,
    },
    {
      key: 'actions',
      header: 'عملیات',
      render: (_v, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePriceEdit(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="ویرایش"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setPriceDeleteTarget(row)}
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
      {/* Contract add button */}
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

      {/* Contract CrudModal */}
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن قرارداد' : 'ویرایش قرارداد'}
        fields={contractModalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={renderCustomField}
      />

      {/* Contract LookupDialog */}
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

      {/* Contract ConfirmDialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این قرارداد اطمینان دارید؟"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Periods Modal */}
      {periodsContract && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPeriodsContract(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-5xl overflow-auto rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                دوره‌های قرارداد - {periodsContract.contractNumber}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePeriodCreate}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  افزودن دوره
                </button>
                <button
                  onClick={() => setPeriodsContract(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <DataTable
              key={periodRefreshKey}
              columns={periodColumns}
              apiEndpoint={`/v1/api/zootag/admin/contractPeriods?contractId=${periodsContract.id}`}
              title=""
              description=""
            />
          </div>
        </div>
      )}

      {/* Period CrudModal */}
      <CrudModal
        open={periodModalOpen}
        mode={periodModalMode}
        title={periodModalMode === 'create' ? 'افزودن دوره' : 'ویرایش دوره'}
        fields={periodModalFields}
        initialValues={selectedPeriod ?? {}}
        loading={periodSaving}
        onSave={handlePeriodSave}
        onClose={() => setPeriodModalOpen(false)}
        renderCustomField={renderPeriodCustomField}
      />

      {/* Period ConfirmDialog */}
      <ConfirmDialog
        open={!!periodDeleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این دوره اطمینان دارید؟"
        loading={periodDeleting}
        onConfirm={handlePeriodDelete}
        onCancel={() => setPeriodDeleteTarget(null)}
      />

      {/* Prices Modal */}
      {pricesPeriod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPricesPeriod(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-6xl overflow-auto rounded-xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                قیمت‌های دوره - {pricesPeriod.periodName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePriceCreate}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  افزودن قیمت
                </button>
                <button
                  onClick={() => setPricesPeriod(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <DataTable
              key={priceRefreshKey}
              columns={priceColumns}
              apiEndpoint={`/v1/api/zootag/admin/contractPeriodDevicePrices?contractPeriodId=${pricesPeriod.id}`}
              title=""
              description=""
            />
          </div>
        </div>
      )}

      {/* Price CrudModal */}
      <CrudModal
        open={priceModalOpen}
        mode={priceModalMode}
        title={priceModalMode === 'create' ? 'افزودن قیمت' : 'ویرایش قیمت'}
        fields={priceModalFields}
        initialValues={selectedPrice ?? {}}
        loading={priceSaving}
        onSave={handlePriceSave}
        onClose={() => setPriceModalOpen(false)}
        renderCustomField={renderPriceCustomField}
      />

      {/* Price LookupDialog */}
      {priceLookupConfig && (
        <LookupDialog
          open={priceLookupOpen}
          config={priceLookupConfig}
          selectedValue={
            priceLookupTarget === 'deviceType'
              ? selectedDeviceTypeId
              : priceLookupTarget === 'priceCurrency'
                ? selectedPriceCurrencyId
                : selectedSellingCurrencyId
          }
          onSelect={(value, label) => {
            if (pricePendingOnChangeRef.current) {
              pricePendingOnChangeRef.current(value);
              pricePendingOnChangeRef.current = null;
            }
            if (priceLookupTarget === 'deviceType') {
              setSelectedDeviceTypeId(value as number);
              setSelectedDeviceTypeName(label);
            } else if (priceLookupTarget === 'priceCurrency') {
              setSelectedPriceCurrencyId(value as number);
              setSelectedPriceCurrencyName(label);
            } else if (priceLookupTarget === 'sellingCurrency') {
              setSelectedSellingCurrencyId(value as number);
              setSelectedSellingCurrencyName(label);
            }
            setPriceLookupOpen(false);
          }}
          onClose={() => {
            pricePendingOnChangeRef.current = null;
            setPriceLookupOpen(false);
          }}
        />
      )}

      {/* Price ConfirmDialog */}
      <ConfirmDialog
        open={!!priceDeleteTarget}
        title="تأیید حذف"
        message="آیا از حذف این قیمت اطمینان دارید؟"
        loading={priceDeleting}
        onConfirm={handlePriceDelete}
        onCancel={() => setPriceDeleteTarget(null)}
      />
    </div>
  );
}
