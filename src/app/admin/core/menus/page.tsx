'use client';

import { useEffect, useState } from 'react';

import { CrudModal, Icon, Input, PageHeader, OperationToolbar, Badge } from '@/components/ui';
import type { FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Menu {
  id: number;
  title: string;
  url: string;
  icon: string;
  className: string;
  parentMenuId: number;
  order: number;
  subMenus?: Menu[];
}

const modalFields: FieldDef[] = [
  { name: 'title', label: 'عنوان', type: 'string', required: true, minLength: 3, maxLength: 256, placeholder: 'عنوان منو را وارد کنید' },
  { name: 'url', label: 'URL', type: 'string', required: true, minLength: 3, maxLength: 1024, placeholder: 'آدرس منو را وارد کنید' },
  { name: 'icon', label: 'آیکون', type: 'string', required: true, minLength: 2, maxLength: 256, placeholder: 'نام آیکون را وارد کنید' },
  { name: 'className', label: 'کلاس CSS', type: 'string', required: false, maxLength: 256, placeholder: 'کلاس CSS را وارد کنید' },
  { name: 'order', label: 'ترتیب', type: 'number', placeholder: 'ترتیب منو را وارد کنید' },
];

export default function MenusPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Menu | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [data, setData] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyParent, setOnlyParent] = useState(false);
  const [showChildren, setShowChildren] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params: Record<string, unknown> = {};
    if (onlyParent) params.onlyParent = 'true';
    let cancelled = false;
    apiClient
      .get<Menu[]>('/v1/api/core/admin/menus', { ignorePaging: true, ...params })
      .then(({ result }) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [onlyParent, refreshKey]);

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (row: Menu) => {
    setModalMode('edit');
    setSelected(row);
    setModalOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        await apiClient.post('/v1/api/core/admin/menus', values);
      } else {
        await apiClient.put(`/v1/api/core/admin/menus/${selected!.id}`, values);
      }
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderRows = (menu: Menu, depth = 0): React.ReactNode[] => {
    const hasChildren = menu.subMenus && menu.subMenus.length > 0;
    const isExpanded = expandedRows.has(menu.id);

    const rows: React.ReactNode[] = [
      <tr key={`${menu.id}-${depth}`} className="border-b border-border transition-colors hover:bg-surface-secondary/50">
        <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
          <span style={{ paddingRight: `${depth * 24}px` }} className="flex items-center gap-1">
            {depth > 0 && (
              <span className="text-xs text-muted">└</span>
            )}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(menu.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-surface-secondary"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!hasChildren && <span className="inline-block w-5" />}
            {menu.id}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <span className="flex items-center gap-2">
            <Icon icon={menu.icon || 'circle'} size={18} />
            <span className="text-muted">{menu.icon}</span>
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{menu.title}</td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{menu.url}</td>
        <td className="whitespace-nowrap px-4 py-3">
          {menu.className ? (
            <Badge variant="default" size="sm">{menu.className}</Badge>
          ) : '—'}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">{menu.order}</td>
        <td className="whitespace-nowrap px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(menu)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </td>
      </tr>,
    ];

    if (isExpanded && hasChildren && showChildren) {
      for (const child of menu.subMenus!) {
        rows.push(...renderRows(child, depth + 1));
      }
    }

    return rows;
  };

  return (
    <div>
      <PageHeader
        variant="card"
        title="منوها"
        description="مدیریت منوهای سیستم"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'منوها' },
        ]}
      >
        <OperationToolbar
          buttons={[
            {
              key: 'create',
              label: 'افزودن منو',
              icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              ),
              variant: 'primary',
              onClick: handleCreate,
            },
          ]}
        />
      </PageHeader>

      <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyParent}
            onChange={(e) => setOnlyParent(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          فقط منوهای اصلی
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showChildren}
            onChange={(e) => setShowChildren(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          نمایش زیرمنوها
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted">نتیجه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">شناسه</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">آیکون</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">عنوان</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">URL</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">کلاس CSS</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">ترتیب</th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-muted">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data.flatMap((menu) => renderRows(menu))}
            </tbody>
          </table>
        )}
      </div>

      <CrudModal
        open={modalOpen}
        mode={modalMode}
        title={modalMode === 'create' ? 'افزودن منو' : 'ویرایش منو'}
        fields={modalFields}
        initialValues={selected ?? {}}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        renderCustomField={(field, value, onChange, error) => {
          if (field.name === 'icon') {
            return (
              <div className="flex flex-col gap-2">
                <Input
                  label={field.label}
                  value={String(value ?? '')}
                  onChange={(e) => onChange(e.target.value)}
                  error={error}
                  placeholder={field.placeholder}
                />
                {value && String(value).trim() && (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                    <span>پیش‌نمایش:</span>
                    <Icon icon={String(value)} size={20} />
                  </div>
                )}
              </div>
            );
          }
          return null;
        }}
      />
    </div>
  );
}
