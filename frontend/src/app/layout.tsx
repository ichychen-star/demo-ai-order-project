import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'AI Vehicle Order System',
  description: 'AI-assisted B2B vehicle order management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
