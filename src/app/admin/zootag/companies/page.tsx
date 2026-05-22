'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'companyName', header: 'نام شرکت' },
  { key: 'legalName', header: 'نام حقوقی' },
  { key: 'email', header: 'ایمیل' },
  { key: 'phone', header: 'تلفن' },
  {
    key: 'isActive',
    header: 'فعال',
    render: (v) =>
      v ? (
        <span className="text-success font-medium">فعال</span>
      ) : (
        <span className="text-muted">غیرفعال</span>
      ),
  },
];

export default function CompaniesPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/zootag/admin/companies"
      title="شرکت‌ها"
      description="مدیریت شرکت‌ها"
    />
  );
}
