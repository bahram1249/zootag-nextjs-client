'use client';

import { useState } from 'react';

import { DataTable, CrudModal } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email?: string;
  phoneNumber?: string;
  // roles: number[] — managed via role management page
}

const modalFields: FieldDef[] = [
  { name: 'username', label: 'نام کاربری', type: 'string', required: true, minLength: 3, maxLength: 128, placeholder: 'نام کاربری را وارد کنید' },
  { name: 'firstname', label: 'نام', type: 'string', required: true, minLength: 2, maxLength: 128, placeholder: 'نام را وارد کنید' },
  { name: 'lastname', label: 'نام خانوادگی', type: 'string', required: true, minLength: 2, maxLength: 128, placeholder: 'نام خانوادگی را وارد کنید' },
  { name: 'email', label: 'ایمیل', type: 'string', required: false, placeholder: 'ایمیل را وارد کنید' },
  { name: 'phoneNumber', label: 'تلفن', type: 'string', required: false, placeholder: 'شماره تلفن را وارد کنید' },
  // roles field omitted — assign roles via the role management page
];

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: User) => {
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/core/admin/users', values);
      } else {
        await apiClient.put(`/v1/api/core/admin/users/${selected!.id}`, values);
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

  const columns: Column<User>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'username', header: 'نام کاربری' },
    { key: 'firstname', header: 'نام' },
    { key: 'lastname', header: 'نام خانوادگی' },
    { key: 'email', header: 'ایمیل' },
    { key: 'phoneNumber', header: 'تلفن' },
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
        apiEndpoint="/v1/api/core/admin/users"
        title="کاربران"
        description="مدیریت کاربران سیستم"
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن کاربر' : 'ویرایش کاربر'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
