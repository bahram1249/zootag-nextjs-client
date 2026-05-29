'use client';

import { useState } from 'react';
import { DataTable, CrudModal, ConfirmDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';
import { formatPrice, formatPersianDate } from '@/lib/format';

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
  { name: 'exchangeRateToIRR', label: 'نرخ برابری به ریال', type: 'price', placeholder: 'مثال: ۷۵۰,۰۰۰' },
  { name: 'isBaseCurrency', label: 'ارز پایه', type: 'boolean' },
];

export default function CurrenciesPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Currency | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [historyCurrencyId, setHistoryCurrencyId] = useState<number | null>(null);

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
      showError(getErrorMessage(e));
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
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Currency>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'code', header: 'کد' },
    { key: 'name', header: 'نام' },
    { key: 'symbol', header: 'نماد' },
    { key: 'exchangeRateToIRR', header: 'نرخ برابری به ریال', render: (v) => formatPrice(v) },
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
            onClick={() => setHistoryCurrencyId(row.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            title="تاریخچه نرخ ارز"
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

  return (
    <div>
      <PageHeader
        variant="card"
        title="ارزها"
        description="مدیریت ارزها"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'ارزها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن ارز',
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
        apiEndpoint="/v1/api/zootag/admin/currencies"
        title="ارزها"
        description="مدیریت ارزها"
        hideHeader
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
      {historyCurrencyId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHistoryCurrencyId(null)}>
          <div className="max-h-[80vh] w-full max-w-3xl overflow-auto rounded-xl bg-surface p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">تاریخچه نرخ ارز</h2>
              <button
                onClick={() => setHistoryCurrencyId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DataTable
              columns={[
                { key: 'id', header: 'شناسه' },
                { key: 'exchangeRateToIRR', header: 'نرخ برابری به ریال', render: (v) => formatPrice(v) },
                { key: 'createdAt', header: 'تاریخ ایجاد', render: (v) => formatPersianDate(v) },
              ]}
              apiEndpoint={`/v1/api/zootag/admin/currencyHistories?currencyId=${historyCurrencyId}`}
              title=""
              description=""
            />
          </div>
        </div>
      )}
    </div>
  );
}
