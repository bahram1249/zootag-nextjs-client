'use client';

import { DataTable, PageHeader } from '@/components/ui';
import type { Column } from '@/components/ui';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'permissionGroupName', header: 'نام گروه' },
  { key: 'order', header: 'ترتیب' },
];

export default function PermissionGroupsPage() {
  return (
    <div>
      <PageHeader
        variant="card"
        title="گروه‌های دسترسی"
        description="مدیریت گروه‌های دسترسی"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'گروه‌های دسترسی' },
        ]}
      />
      <DataTable
        columns={columns}
        apiEndpoint="/v1/api/core/admin/permissionGroups"
        title="گروه‌های دسترسی"
        description="مدیریت گروه‌های دسترسی"
        hideHeader
      />
    </div>
  );
}
