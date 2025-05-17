import { Focus } from 'lucide-react'; // Changed from Eye to Focus
// Removed Button from imports as it's no longer used here

interface HeaderProps {
  // onLogNewCase is removed as the landing page will handle CTAs
}

export function Header({}: HeaderProps) { // onLogNewCase removed from props
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Focus className="h-7 w-7 text-primary" /> {/* Changed icon */}
          <h1 className="text-2xl font-bold text-foreground">Focus CaseX</h1> {/* Changed name */}
        </div>
        {/* "Log New Case" button removed, can be added back if a global action is needed */}
      </div>
    </header>
  );
}
