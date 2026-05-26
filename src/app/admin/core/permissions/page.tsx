'use client';

import { DataTable, PageHeader } from '@/components/ui';
import type { Column } from '@/components/ui';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'permissionSymbol', header: 'سمبل دسترسی' },
  { key: 'permissionName', header: 'نام دسترسی' },
  { key: 'permissionUrl', header: 'URL' },
];

export default function PermissionsPage() {
  return (
    <div>
      <PageHeader
        variant="card"
        title="دسترسی‌ها"
        description="مدیریت دسترسی‌ها"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'دسترسی‌ها' },
        ]}
      />
      <DataTable
        columns={columns}
        apiEndpoint="/v1/api/core/admin/permissions"
        title="دسترسی‌ها"
        description="مدیریت دسترسی‌ها"
        hideHeader
      />
    </div>
  );
}
