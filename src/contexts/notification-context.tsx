'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastVariant = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface NotificationContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let nextId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);

    const duration = variant === 'error' ? 8000 : 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showError = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const showSuccess = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const showWarning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);
  const showInfo = useCallback((message: string) => addToast(message, 'info'), [addToast]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showError, showSuccess, showWarning, showInfo }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const iconMap: Record<ToastVariant, ReactNode> = {
    error: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borderColorMap: Record<ToastVariant, string> = {
    error: 'border-danger',
    success: 'border-success',
    warning: 'border-warning',
    info: 'border-info',
  };

  return (
    <div
      className={`flex min-w-[320px] max-w-[420px] items-start gap-3 rounded-xl border-r-4 bg-surface px-4 py-3 shadow-lg ${borderColorMap[toast.variant]}`}
      role="alert"
    >
      <span className={`shrink-0 ${toast.variant === 'error' ? 'text-danger' : toast.variant === 'success' ? 'text-success' : toast.variant === 'warning' ? 'text-warning' : 'text-info'}`}>
        {iconMap[toast.variant]}
      </span>
      <p className="flex-1 text-sm text-zinc-900 dark:text-zinc-100">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition-colors hover:bg-surface-secondary"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
