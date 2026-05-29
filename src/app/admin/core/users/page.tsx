'use client';

import { useEffect, useState } from 'react';

import { DataTable, CrudModal, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface UserRole {
  id: number;
  roleName: string;
  static_id?: number;
}

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email?: string;
  phoneNumber?: string;
  roles?: UserRole[];
}

interface Role {
  id: number;
  roleName: string;
  static_id?: number;
}

const modalFields: FieldDef[] = [
  { name: 'username', label: 'نام کاربری', type: 'string', required: true, minLength: 3, maxLength: 128, placeholder: 'نام کاربری را وارد کنید' },
  { name: 'firstname', label: 'نام', type: 'string', required: true, minLength: 2, maxLength: 128, placeholder: 'نام را وارد کنید' },
  { name: 'lastname', label: 'نام خانوادگی', type: 'string', required: true, minLength: 2, maxLength: 128, placeholder: 'نام خانوادگی را وارد کنید' },
  { name: 'email', label: 'ایمیل', type: 'string', required: false, placeholder: 'ایمیل را وارد کنید' },
  { name: 'phoneNumber', label: 'تلفن', type: 'string', required: false, placeholder: 'شماره تلفن را وارد کنید' },
];

export default function UsersPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    if (!modalOpen) return;
    apiClient
      .get<Role[]>('/v1/api/core/admin/roles', { ignorePaging: true })
      .then(({ result }) => setAllRoles(result))
      .catch(console.error);
  }, [modalOpen]);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setSelectedRoleIds([]);
    setModalOpen(true);
  };

  const handleEdit = (row: User) => {
    setModalMode('edit');
    setSelected(row);
    setSelectedRoleIds(row.roles?.map((r) => r.id) ?? []);
    setModalOpen(true);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...values, roles: selectedRoleIds };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/core/admin/users', payload);
      } else {
        await apiClient.put(`/v1/api/core/admin/users/${selected!.id}`, payload);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
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
      key: 'roles',
      header: 'نقش‌ها',
      render: (_v, row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.length
            ? row.roles.map((role) => (
                <Badge key={role.id} variant="primary" size="sm">
                  {role.roleName}
                </Badge>
              ))
            : '—'}
        </div>
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        variant="card"
        title="کاربران"
        description="مدیریت کاربران سیستم"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کاربران' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن کاربر',
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
        apiEndpoint="/v1/api/core/admin/users"
        title="کاربران"
        description="مدیریت کاربران سیستم"
        hideHeader
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
      >
        {allRoles.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              نقش‌ها
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {allRoles.map((role) => {
                const checked = selectedRoleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    {role.roleName}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </CrudModal>
    </div>
  );
}
