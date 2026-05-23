import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeClientLayout>
          <AuthClientLayout>{children}</AuthClientLayout>
        </ThemeClientLayout>
      </body>
    </html>
  );
}
