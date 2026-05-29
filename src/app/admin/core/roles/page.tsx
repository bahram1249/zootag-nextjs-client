'use client';

import { useEffect, useState } from 'react';

import { DataTable, CrudModal, ConfirmDialog, Badge, PageHeader, OperationToolbar } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';
import { useNotification } from '@/contexts/notification-context';

interface RolePermission {
  id: number;
  permissionSymbol: string;
  permissionName?: string;
}

interface Role {
  id: number;
  roleName: string;
  permissions?: RolePermission[];
}

interface Permission {
  id: number;
  permissionSymbol: string;
  permissionName?: string;
}

interface PermissionGroup {
  id: number;
  permissionGroupName: string;
  permissions?: Permission[];
}

const modalFields: FieldDef[] = [
  { name: 'roleName', label: 'نام نقش', type: 'string', required: true, minLength: 3, maxLength: 256, placeholder: 'نام نقش را وارد کنید' },
];

export default function RolesPage() {
  const { showError } = useNotification();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [permGroupsLoading, setPermGroupsLoading] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [debouncedPermSearch, setDebouncedPermSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPermSearch(permSearch), 500);
    return () => clearTimeout(timer);
  }, [permSearch]);

  useEffect(() => {
    if (!modalOpen) return;
    apiClient
      .get<PermissionGroup[]>('/v1/api/core/admin/permissionGroups', { ignorePaging: true })
      .then(({ result }) => setPermissionGroups(result))
      .catch(console.error)
      .finally(() => setPermGroupsLoading(false));
  }, [modalOpen]);

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setSelectedPermissionIds([]);
    setPermSearch('');
    setDebouncedPermSearch('');
    setPermGroupsLoading(true);
    setModalOpen(true);
  };

  const handleEdit = (row: Role) => {
    setModalMode('edit');
    setSelected(row);
    setSelectedPermissionIds(row.permissions?.map((p) => p.id) ?? []);
    setPermSearch('');
    setDebouncedPermSearch('');
    setPermGroupsLoading(true);
    setModalOpen(true);
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const payload = { ...values, permissions: selectedPermissionIds };
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/core/admin/roles', payload);
      } else {
        await apiClient.put(`/v1/api/core/admin/roles/${selected!.id}`, payload);
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
      await apiClient.delete(`/v1/api/core/admin/roles/${deleteTarget.id}`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showError(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Role>[] = [
    { key: 'id', header: 'شناسه' },
    { key: 'roleName', header: 'نام نقش' },
    {
      key: 'permissions',
      header: 'دسترسی‌ها',
      render: (_v, row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions?.length
            ? row.permissions.map((perm) => (
                <Badge key={perm.id} variant="info" size="sm">
                  {perm.permissionSymbol}
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
        title="نقش‌ها"
        description="مدیریت نقش‌های کاربری"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'نقش‌ها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن نقش',
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
        apiEndpoint="/v1/api/core/admin/roles"
        title="نقش‌ها"
        description="مدیریت نقش‌های کاربری"
        hideHeader
      />
      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن نقش' : 'ویرایش نقش'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setPermGroupsLoading(false); }}
      >
        {permGroupsLoading ? (
          <div className="flex items-center justify-center py-6">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : permissionGroups.length > 0 ? (
          <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              دسترسی‌ها
            </legend>
            <input
              type="text"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="جستجوی دسترسی..."
              className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
              {permissionGroups
                .map((group) => ({
                  ...group,
                  permissions: group.permissions?.filter(
                    (p) =>
                      !debouncedPermSearch ||
                      p.permissionSymbol.toLowerCase().includes(debouncedPermSearch.toLowerCase()) ||
                      p.permissionName?.toLowerCase().includes(debouncedPermSearch.toLowerCase()),
                  ),
                }))
                .filter((group) => group.permissions && group.permissions.length > 0)
                .map((group) => (
                  <div key={group.id} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {group.permissionGroupName}
                    </span>
                    <div className="flex flex-col gap-0.5 pr-2">
                      {group.permissions?.map((perm) => {
                        const checked = selectedPermissionIds.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-surface-secondary"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm.id)}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                            <span dir="ltr" className="text-xs">
                              {perm.permissionSymbol}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              {(!debouncedPermSearch
                ? false
                : !permissionGroups.some((g) =>
                    g.permissions?.some(
                      (p) =>
                        p.permissionSymbol
                          .toLowerCase()
                          .includes(debouncedPermSearch.toLowerCase()) ||
                        p.permissionName
                          ?.toLowerCase()
                          .includes(debouncedPermSearch.toLowerCase()),
                    ),
                  )) && (
                <p className="py-2 text-center text-sm text-muted">نتیجه‌ای یافت نشد</p>
              )}
            </div>
          </fieldset>
        ) : null}
      </CrudModal>
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
