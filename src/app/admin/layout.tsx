'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useNotification } from '@/contexts/notification-context';
import { getErrorMessage } from '@/lib/error-handler';
import { fetchMenus } from '@/lib/menus';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Icon } from '@/components/ui';
import type { MenuNode } from '@/lib/auth-types';

function toFrontendUrl(backendUrl: string | null): string {
  if (!backendUrl) return '#';
  if (backendUrl.startsWith('/core/admin/')) {
    const name = backendUrl.replace('/core/admin/', '');
    const mapped: Record<string, string> = {
      users: '/admin/users',
      roles: '/admin/roles',
      permissions: '/admin/permissions',
      menus: '/admin/menus',
      permissionGroups: '/admin/permission-groups',
    };
    return mapped[name] ?? backendUrl;
  }
  if (backendUrl.startsWith('/admin/')) return backendUrl;
  return backendUrl;
}

function hasActiveDescendant(node: MenuNode, pathname: string): boolean {
  if (!node.subMenus) return false;
  for (const child of node.subMenus) {
    const childHref = toFrontendUrl(child.url);
    if (pathname === childHref || pathname.startsWith(childHref + '/')) return true;
    if (hasActiveDescendant(child, pathname)) return true;
  }
  return false;
}

function MenuItem({ node, depth }: { node: MenuNode; depth: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const prevPathname = useRef('');
  const hasChildren = node.subMenus && node.subMenus.length > 0;
  const href = toFrontendUrl(node.url);
  const isActive = pathname === href || pathname.startsWith(href + '/');

  if (pathname !== prevPathname.current) {
    prevPathname.current = pathname;
    if (hasChildren && (pathname.startsWith(href + '/') || pathname === href || hasActiveDescendant(node, pathname))) {
      setOpen(true);
    }
  }

  return (
    <div>
      <a
        href={href}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-primary-light text-primary font-medium'
            : 'text-muted-foreground hover:bg-surface-secondary'
        }`}
        style={{ paddingRight: `${12 + depth * 16}px` }}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <Icon icon={node.icon || 'circle'} size={18} />
        </span>
        <span className="flex-1">{node.title}</span>
        {hasChildren && (
          <svg
            className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </a>
      {hasChildren && open && (
        <div className="mt-1">
          {node.subMenus!.map((child) => (
            <MenuItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function filterMenus(nodes: MenuNode[], query: string): MenuNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return nodes;
  return nodes.filter((node) => {
    if (node.title.toLowerCase().includes(q)) return true;
    if (node.subMenus) {
      const filteredChildren = node.subMenus.filter((c) =>
        c.title.toLowerCase().includes(q),
      );
      if (filteredChildren.length > 0) {
        node.subMenus = filteredChildren;
        return true;
      }
    }
    return false;
  });
}

function Sidebar({ menus }: { menus: MenuNode[] }) {
  const { user, logout } = useAuth();
  const name = user?.firstname || user?.username || 'کاربر';
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredMenus = filterMenus(
    menus.map((m) => ({ ...m, subMenus: m.subMenus ? [...m.subMenus] : undefined })),
    search,
  );

  return (
    <aside className="flex w-64 flex-col border-l border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {name[0]}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</p>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-secondary"
          title="خروج"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>

      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی منو..."
            className="w-full rounded-lg border border-border bg-surface py-1.5 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-primary focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); inputRef.current?.focus(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {filteredMenus.length === 0 && (
          <p className="text-center text-sm text-muted">نتیجه‌ای یافت نشد</p>
        )}
        <div className="space-y-1">
          {filteredMenus.map((menu) => (
            <MenuItem key={menu.id} node={menu} depth={0} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { showError } = useNotification();
  const router = useRouter();
  const [menus, setMenus] = useState<MenuNode[]>([]);
  const [menusLoading, setMenusLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMenus()
      .then((result) => {
        setMenus(result);
        setMenusLoading(false);
      })
      .catch((err) => {
        showError(getErrorMessage(err));
        setMenus([]);
        setMenusLoading(false);
      });
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar menus={menus} />
      <main className="flex min-w-0 flex-1 flex-col bg-surface-secondary p-6">
        {menusLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
