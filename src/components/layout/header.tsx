import { Eye } from 'lucide-react'; // Changed from Focus to Eye

interface HeaderProps {
}

export function Header({}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-7 w-7 text-primary" /> {/* Changed icon */}
          <h1 className="text-2xl font-bold text-foreground">Focus CaseX</h1> {/* Changed name */}
        </div>
      </div>
    </header>
  );
}
