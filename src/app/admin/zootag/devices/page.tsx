'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'serialNumber', header: 'سریال نمبر' },
  { key: 'imei', header: 'IMEI' },
  { key: 'macAddress', header: 'MAC Address' },
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

export default function DevicesPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/zootag/admin/devices"
      title="دستگاه‌ها"
      description="مدیریت دستگاه‌ها"
    />
  );
}
