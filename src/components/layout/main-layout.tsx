import type React from 'react';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogNewCase: () => void;
}

export function MainLayout({ children, onLogNewCase }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header onLogNewCase={onLogNewCase} />
      <main className="flex-1 container py-8">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FocusCase AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
