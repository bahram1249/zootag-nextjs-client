'use client';

import { AuthProvider } from '@/contexts/auth-context';
import { NotificationProvider } from '@/contexts/notification-context';

export function AuthClientLayout({ children, initialAccessToken }: { children: React.ReactNode; initialAccessToken?: string | null }) {
  return (
    <AuthProvider initialAccessToken={initialAccessToken}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  );
}
