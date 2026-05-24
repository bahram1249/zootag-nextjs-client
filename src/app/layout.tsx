import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { headers } from 'next/headers';
import { AuthClientLayout } from '@/components/auth/auth-client-layout';
import { ThemeClientLayout } from '@/components/theme/theme-client-layout';
import './globals.css';

const vazirmatn = Vazirmatn({
  variable: '--font-vazirmatn',
  subsets: ['arabic', 'latin'],
});

export const metadata: Metadata = {
  title: 'زوتگ',
  description: 'زوتگ — برنامه برچسب‌گذاری',
};

const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') || '';
  const accessToken = cookieHeader
    .split('; ')
    .find(c => c.startsWith('access_token='))
    ?.split('=')[1] ?? null;

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div aria-hidden="true" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `<script>${themeScript}<\/script>` }} />
        <ThemeClientLayout>
          <AuthClientLayout initialAccessToken={accessToken}>{children}</AuthClientLayout>
        </ThemeClientLayout>
      </body>
    </html>
  );
}
