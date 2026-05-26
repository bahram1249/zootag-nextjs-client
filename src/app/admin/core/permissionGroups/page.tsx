'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'permissionGroupName', header: 'نام گروه' },
  { key: 'order', header: 'ترتیب' },
];

export default function PermissionGroupsPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/core/admin/permissionGroups"
      title="گروه‌های دسترسی"
      description="مدیریت گروه‌های دسترسی"
    />
  );
}
