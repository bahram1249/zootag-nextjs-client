'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'manufacturerName', header: 'نام سازنده' },
  { key: 'description', header: 'توضیحات' },
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

export default function ManufacturersPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/zootag/admin/manufacturers"
      title="سازنده‌ها"
      description="مدیریت سازنده‌های دستگاه"
    />
  );
}
