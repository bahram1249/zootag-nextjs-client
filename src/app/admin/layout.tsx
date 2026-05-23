'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { fetchMenus } from '@/lib/menus';
import { ThemeToggle } from '@/components/theme/theme-toggle';
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
        {node.icon && (
          <span className="flex h-5 w-5 items-center justify-center text-base">{node.icon}</span>
        )}
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

function Sidebar({ menus }: { menus: MenuNode[] }) {
  const { user, logout } = useAuth();
  const name = user?.firstname || user?.username || 'کاربر';

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

      <nav className="flex-1 overflow-y-auto p-3">
        {menus.length === 0 && (
          <p className="text-center text-sm text-muted">منویی یافت نشد</p>
        )}
        <div className="space-y-1">
          {menus.map((menu) => (
            <MenuItem key={menu.id} node={menu} depth={0} />
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
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
    fetchMenus().then((result) => {
      setMenus(result);
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
      <main className="flex flex-1 flex-col bg-surface-secondary p-6">
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
