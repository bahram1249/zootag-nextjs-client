'use client';

import { useState } from 'react';

import { DataTable, CrudModal, Icon, Input, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Menu {
  id: number;
  title: string;
  url: string;
  icon: string;
  className: string;
  parentMenuId: number;
  order: number;
}

const modalFields: FieldDef[] = [
  { name: 'title', label: 'عنوان', type: 'string', required: true, minLength: 3, maxLength: 256, placeholder: 'عنوان منو را وارد کنید' },
  { name: 'url', label: 'URL', type: 'string', required: true, minLength: 3, maxLength: 1024, placeholder: 'آدرس منو را وارد کنید' },
  { name: 'icon', label: 'آیکون', type: 'string', required: true, minLength: 2, maxLength: 256, placeholder: 'نام آیکون را وارد کنید' },
  { name: 'className', label: 'کلاس CSS', type: 'string', required: false, maxLength: 256, placeholder: 'کلاس CSS را وارد کنید' },
  { name: 'order', label: 'ترتیب', type: 'number', placeholder: 'ترتیب منو را وارد کنید' },
];

export default function MenusPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Menu | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlyParent, setOnlyParent] = useState(false);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Menu) => {
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/core/admin/menus', values);
      } else {
        await apiClient.put(`/v1/api/core/admin/menus/${selected!.id}`, values);
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

  const columns: Column<Menu>[] = [
    { key: 'id', header: 'شناسه' },
    {
      key: 'icon',
      header: 'آیکون',
      render: (_v, row) => (
        <span className="flex items-center gap-2">
          <Icon icon={row.icon || 'circle'} size={18} />
          <span className="text-muted">{row.icon}</span>
        </span>
      ),
    },
    { key: 'title', header: 'عنوان' },
    { key: 'url', header: 'URL' },
    { key: 'className', header: 'کلاس CSS' },
    { key: 'order', header: 'ترتیب' },
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        variant="card"
        title="منوها"
        description="مدیریت منوهای سیستم"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'منوها' },
        ]}
      >
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyParent}
              onChange={(e) => setOnlyParent(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            فقط منوهای اصلی
          </label>
          <OperationToolbar
            buttons={[
              {
                key: 'create',
                label: 'افزودن منو',
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
        </div>
      </PageHeader>
      <DataTable
        key={refreshKey}
        columns={columns}
        apiEndpoint="/v1/api/core/admin/menus"
        title="منوها"
        description="مدیریت منوهای سیستم"
        hideHeader
        extraParams={onlyParent ? { onlyParent: 'true' } : undefined}
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن منو' : 'ویرایش منو'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={(field, value, onChange, error) => {
          if (field.name === 'icon') {
            return (
              <div className="flex flex-col gap-2">
                <Input
                  label={field.label}
                  value={String(value ?? '')}
                  onChange={(e) => onChange(e.target.value)}
                  error={error}
                  placeholder={field.placeholder}
                />
                {value && String(value).trim() && (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                    <span>پیش‌نمایش:</span>
                    <Icon icon={String(value)} size={20} />
                  </div>
                )}
              </div>
            );
          }
          return null;
        }}
      />
    </div>
  );
}
