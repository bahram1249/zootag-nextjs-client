'use client';

import { ThemeProvider } from '@/contexts/theme-context';
import type { ReactNode } from 'react';

export function ThemeClientLayout({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
