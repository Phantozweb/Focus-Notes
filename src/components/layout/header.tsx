
'use client';

import { Eye, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface HeaderProps {
}

export function Header({}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Eye className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-logo">
            <span className="text-primary">Focus Case</span><span className="text-foreground relative">X<span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary animate-blue-blink"></span></span>
          </h1>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.push('#')}>
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </div>
    </header>
  );
}
