
'use client';
import type React from 'react';
import { Header } from './header';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/cases');

  if (isDashboardRoute) {
    // For dashboard routes, the layout is handled by DashboardLayout
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t bg-muted/50">
        <div className="container flex flex-col items-center justify-center gap-2 md:h-20 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Focus CaseX. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            Powered by <span className="font-semibold text-primary">Focus-IN</span> and <span className="font-semibold text-primary">Focus.Ai</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
