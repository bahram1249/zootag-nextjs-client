import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import { AuthClientLayout } from '@/components/auth/auth-client-layout';
import './globals.css';

const vazirmatn = Vazirmatn({
  variable: '--font-vazirmatn',
  subsets: ['arabic', 'latin'],
});

export const metadata: Metadata = {
  title: 'زوتگ',
  description: 'زوتگ — برنامه برچسب‌گذاری',
};

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
    >
      <body className="min-h-full flex flex-col">
        <AuthClientLayout>{children}</AuthClientLayout>
      </body>
    </html>
  );
}
