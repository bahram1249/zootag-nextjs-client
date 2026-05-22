'use client';

import { useParams } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { findPageConfig } from '@/lib/admin-pages';

export default function AdminCatchAllPage() {
  const params = useParams();
  const slug = (params.slug as string[]) ?? [];
  const config = findPageConfig(slug);

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">صفحه مورد نظر یافت نشد</h2>
          <p className="mt-1 text-sm text-muted">آدرس وارد شده معتبر نمی‌باشد.</p>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={config.columns}
      apiEndpoint={config.apiEndpoint}
      title={config.title}
      description={config.description}
    />
  );
}
