'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'contractNumber', header: 'شماره قرارداد' },
  { key: 'title', header: 'عنوان' },
  { key: 'startDate', header: 'تاریخ شروع' },
  { key: 'endDate', header: 'تاریخ پایان' },
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

export default function ContractsPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/zootag/admin/contracts"
      title="قراردادها"
      description="مدیریت قراردادها"
    />
  );
}
