import { ApiError } from './api-client';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorInfo {
  message: string;
  severity: ErrorSeverity;
  statusCode?: number;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
  if (error instanceof TypeError && error.message.includes('NetworkError')) return true;
  if (error instanceof TypeError && error.message.includes('network')) return true;
  return false;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function getErrorInfo(error: unknown): ErrorInfo {
  if (isAbortError(error)) {
    return { message: 'درخواست لغو شد', severity: 'info' };
  }

  if (isNetworkError(error)) {
    return {
      message: 'خطا در ارتباط با سرور. لطفاً اتصال خود را بررسی کنید.',
      severity: 'error',
    };
  }

  if (error instanceof ApiError) {
    const statusCode = error.statusCode;
    const message =
      error.errors.length > 0
        ? Array.isArray(error.errors)
          ? error.errors.join(' - ')
          : String(error.errors)
        : error.message;

    if (statusCode === 401) {
      return {
        message: message || 'لطفاً مجدداً وارد شوید',
        severity: 'warning',
        statusCode,
      };
    }

    if (statusCode === 403) {
      return {
        message: message || 'شما دسترسی لازم را ندارید',
        severity: 'warning',
        statusCode,
      };
    }

    if (statusCode === 404) {
      return {
        message: message || 'مورد درخواستی یافت نشد',
        severity: 'warning',
        statusCode,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        message: message || 'خطای داخلی سرور',
        severity: 'error',
        statusCode,
      };
    }

    return { message, severity: 'error', statusCode };
  }

  if (error instanceof Error) {
    return { message: error.message || 'خطای نامشخص', severity: 'error' };
  }

  return { message: 'خطای نامشخصی رخ داد', severity: 'error' };
}

export function getErrorMessage(error: unknown): string {
  return getErrorInfo(error).message;
}
