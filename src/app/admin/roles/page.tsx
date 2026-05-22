'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'roleName', header: 'نام نقش' },
];

export default function RolesPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/core/admin/roles"
      title="نقش‌ها"
      description="مدیریت نقش‌های کاربری"
    />
  );
}
