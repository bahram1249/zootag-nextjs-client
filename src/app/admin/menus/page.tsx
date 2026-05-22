'use client';

import { DataTable } from '@/components/ui/data-table';
import type { Column } from '@/components/ui/data-table';

const columns: Column<Record<string, unknown>>[] = [
  { key: 'id', header: 'شناسه' },
  { key: 'title', header: 'عنوان' },
  { key: 'url', header: 'URL' },
  { key: 'order', header: 'ترتیب' },
];

export default function MenusPage() {
  return (
    <DataTable
      columns={columns}
      apiEndpoint="/v1/api/core/admin/menus"
      title="منوها"
      description="مدیریت منوهای سیستم"
    />
  );
}
