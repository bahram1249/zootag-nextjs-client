'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'permissionSymbol', header: 'سمبل دسترسی' },
  { key: 'permissionName', header: 'نام دسترسی' },
  { key: 'permissionUrl', header: 'URL' },
];

export default function PermissionsPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/core/admin/permissions"
      title="دسترسی‌ها"
      description="مدیریت دسترسی‌ها"
    />
  );
}
