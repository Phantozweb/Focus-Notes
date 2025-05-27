
'use client';

// This file is not directly used anymore after /app/cases/page.tsx was updated to include its logic.
// However, it's good practice to keep it or remove it if it's truly obsolete.
// For now, let's assume it might be repurposed or that its logic is now in /app/cases/page.tsx.
// If it were to be used, it would look something like this:

import type { StoredOptometryCase } from '@/types/case';
import { CaseCard } from './case-card'; // Assuming CaseCard props are updated
import { Button } from './ui/button';
import { Download, PlusCircle } from 'lucide-react';

interface CaseListProps {
  cases: StoredOptometryCase[];
  onSelectCase: (caseId: string) => void; // Changed to pass ID
  // onAnalyzeCase: (caseId: string) => void; // Analysis is typically done in detail view
  onDeleteCase: (caseId: string) => void;
  onExportCases: () => void;
  onLogNewCase: () => void;
  // analyzingCaseId?: string | null; // This state is likely managed by the parent page
}

export function CaseList({
  cases,
  onSelectCase,
  // onAnalyzeCase,
  onDeleteCase,
  onExportCases,
  onLogNewCase,
  // analyzingCaseId,
}: CaseListProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-card">
        <img src="https://placehold.co/300x200.png" alt="No cases illustration" data-ai-hint="empty state medical" className="mb-6 rounded opacity-70" />
        <h3 className="text-2xl font-semibold mb-2 text-foreground">No Cases Logged Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start by logging your first optometry case to see it appear here and unlock AI-powered analysis.
        </p>
        <Button onClick={onLogNewCase} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Log Your First Case
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onExportCases} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export All to CSV
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseData={caseItem}
            onViewDetails={onSelectCase}
            onDelete={onDeleteCase}
            // isAnalyzing={analyzingCaseId === caseItem.id} // This prop would be passed if CaseCard directly handled analysis indication
          />
        ))}
      </div>
    </div>
  );
}
