'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/auth/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import '@/components/static/styles/globals.css';

export const metadata = {
  title: 'Mobile Budget App',
  description: 'A mobile budget management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider defaultTheme="dark">
          <div className="min-h-screen bg-background">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <ThemeToggle />
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
