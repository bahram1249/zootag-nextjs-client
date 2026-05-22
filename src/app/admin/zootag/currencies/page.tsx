'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'code', header: 'کد' },
  { key: 'name', header: 'نام' },
  { key: 'symbol', header: 'نماد' },
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

export default function CurrenciesPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/zootag/admin/currencies"
      title="ارزها"
      description="مدیریت ارزها"
    />
  );
}
