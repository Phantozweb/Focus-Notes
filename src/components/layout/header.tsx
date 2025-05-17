import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onLogNewCase: () => void;
}

export function Header({ onLogNewCase }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">FocusCase AI</h1>
        </div>
        <Button onClick={onLogNewCase}>Log New Case</Button>
      </div>
    </header>
  );
}
