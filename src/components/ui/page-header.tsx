'use client';

import { useEffect, type ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: ReactNode;
  variant?: 'default' | 'card';
}

export function PageHeader({ title, description, breadcrumbs, children, variant = 'default' }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} | زوتگ`;
  }, [title]);
  const inner = (
    <>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={`flex items-center gap-1 text-sm text-muted ${variant === 'card' ? 'mb-3' : 'mb-2'}`}>
          {breadcrumbs.map((item, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-zinc-900 dark:text-zinc-100">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {children && (
        <div className={`${variant === 'card' ? 'mt-4 border-t border-border pt-4' : 'mt-4'}`}>
          {children}
        </div>
      )}
    </>
  );

  if (variant === 'card') {
    return <div className="mb-6 rounded-xl border border-border bg-surface p-6">{inner}</div>;
  }

  return <div className="mb-6">{inner}</div>;
}
