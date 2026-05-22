'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'username', header: 'نام کاربری' },
  { key: 'firstname', header: 'نام' },
  { key: 'lastname', header: 'نام خانوادگی' },
  { key: 'email', header: 'ایمیل' },
  { key: 'phoneNumber', header: 'تلفن' },
];

export default function UsersPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/core/admin/users"
      title="کاربران"
      description="مدیریت کاربران سیستم"
    />
  );
}
