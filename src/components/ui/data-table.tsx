'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface DataTableProps<T> {
  columns: Column<T>[];
  apiEndpoint: string;
  title: string;
  description?: string;
  defaultLimit?: number;
  ignorePaging?: boolean;
  hideHeader?: boolean;
  extraParams?: Record<string, unknown>;
  expandable?: boolean;
  expandableKey?: string;
}

export function DataTable<T>({
  columns,
  apiEndpoint,
  title,
  description,
  defaultLimit = 10,
  ignorePaging = false,
  hideHeader = false,
  extraParams,
  expandable = false,
  expandableKey = 'subMenus',
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(defaultLimit);
  const [orderBy, setOrderBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const hasChildren = (row: T) => {
    const children = (row as Record<string, unknown>)[expandableKey];
    return Array.isArray(children) && children.length > 0;
  };

  const getChildren = (row: T) => {
    return (row as Record<string, unknown>)[expandableKey] as T[] | undefined;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const params: Record<string, unknown> = { ...extraParams };
    if (ignorePaging) {
      params.ignorePaging = true;
    } else {
      params.limit = limit;
      params.offset = offset;
      params.orderBy = orderBy;
      params.sortOrder = sortOrder;
      if (debouncedSearch) params.search = debouncedSearch;
    }

    setError(null);

    apiClient
      .get<T[]>(apiEndpoint, params)
      .then(({ result, total: count }) => {
        if (!cancelled) {
          setData(result);
          setTotal(count ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData([]);
          setTotal(0);
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiEndpoint, limit, offset, debouncedSearch, ignorePaging, extraParams, orderBy, sortOrder]);

  const handleSort = (colKey: string) => {
    const col = columns.find((c) => c.key === colKey);
    if (!col || col.render) return;
    setOffset(0);
    if (orderBy === colKey) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setOrderBy(colKey);
      setSortOrder('DESC');
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setOffset(0);
  };

  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
  const currentPage = totalPages > 0 ? Math.floor(offset / limit) + 1 : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      {!hideHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="h-9 w-56 rounded-lg border border-border bg-surface pr-9 pl-3 text-sm text-zinc-900 placeholder-muted outline-none transition-colors focus:border-primary dark:text-zinc-100"
            />
          </div>
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <svg className="h-8 w-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-danger">{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted">نتیجه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  {expandable && <th key="__expand" className="w-10 px-4 py-3" />}
                  {columns.map((col) => {
                    const isSorted = orderBy === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`whitespace-nowrap px-4 py-3 text-right text-xs font-medium transition-colors ${
                          col.render ? '' : 'cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100'
                        } ${isSorted ? 'text-zinc-900 dark:text-zinc-100' : 'text-muted'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.header}
                          {isSorted && (
                            <svg
                              className={`h-3 w-3 transition-transform ${sortOrder === 'ASC' ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.flatMap((row, i) => {
                  const isExpanded = expandedRows.has(i);
                  const hasCh = hasChildren(row);

                  const rowEl = (
                    <tr
                      key={i}
                      className="border-b border-border transition-colors last:border-0 hover:bg-surface-secondary/50"
                    >
                      {expandable && (
                        <td className="w-10 px-4 py-3">
                          {hasCh && (
                            <button
                              onClick={() => toggleExpand(i)}
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
                        </td>
                      )}
                      {columns.map((col) => {
                        const cellValue = (row as Record<string, unknown>)[col.key];
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                            {col.render
                              ? col.render(cellValue, row)
                              : cellValue != null
                                ? String(cellValue)
                                : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );

                  if (isExpanded && hasCh) {
                    return [
                      rowEl,
                      ...getChildren(row)!.map((child, ci) => (
                        <tr
                          key={`${i}-${ci}`}
                          className="border-b border-border bg-surface-secondary/30 transition-colors last:border-0"
                        >
                          {expandable && <td className="w-10 px-4 py-3" />}
                          {columns.map((col) => {
                            const cellValue = (child as Record<string, unknown>)[col.key];
                            return (
                              <td key={col.key} className="whitespace-nowrap px-4 py-3 text-zinc-900 dark:text-zinc-100">
                                <span className="flex items-center gap-1">
                                  <span className="text-xs text-muted">└</span>
                                  {col.render
                                    ? col.render(cellValue, child)
                                    : cellValue != null
                                      ? String(cellValue)
                                      : '—'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      )),
                    ];
                  }

                  return [rowEl];
                })}
              </tbody>
            </table>
        )}
      </div>

      {/* pagination — only when paging is enabled and there's data */}
      {!ignorePaging && totalPages > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <p className="text-muted">
              {`${Math.min(offset + 1, total)}-${Math.min(offset + limit, total)} از ${total}`}
            </p>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-muted outline-none transition-colors focus:border-primary dark:bg-zinc-800"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} عدد
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOffset((p) => Math.max(0, p - limit))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1.5">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-muted">...</span>
                  )}
                  <button
                    onClick={() => setOffset((p - 1) * limit)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-primary text-white'
                        : 'text-muted hover:bg-surface-secondary'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setOffset((p) => p + limit)}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
