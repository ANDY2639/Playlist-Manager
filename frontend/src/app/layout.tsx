import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Playlist Manager',
  description: 'Manage and download your YouTube playlists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
