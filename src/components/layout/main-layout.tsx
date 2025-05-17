import type React from 'react';
import { Header } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  // onLogNewCase is removed as it's no longer handled by the main layout directly for the new landing page
}

export function MainLayout({ children }: MainLayoutProps) { // onLogNewCase removed from props
  return (
    <div className="flex min-h-screen flex-col">
      <Header /> {/* onLogNewCase prop removed */}
      <main className="flex-1"> {/* Removed container and py-8 for more flexibility for page.tsx */}
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t bg-muted/50">
        <div className="container flex flex-col items-center justify-center gap-2 md:h-20 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Focus CaseX. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            Powered by <span className="font-semibold text-primary">Focus</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
