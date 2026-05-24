'use client';

import { AuthProvider } from '@/contexts/auth-context';

export function AuthClientLayout({ children, initialAccessToken }: { children: React.ReactNode; initialAccessToken?: string | null }) {
  return <AuthProvider initialAccessToken={initialAccessToken}>{children}</AuthProvider>;
}
