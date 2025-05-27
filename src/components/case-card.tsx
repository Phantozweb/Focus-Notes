
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, Trash2, CalendarDays } from "lucide-react";
import type { StoredOptometryCase } from "@/types/case"; // Updated type
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface CaseCardProps {
  caseData: StoredOptometryCase; // Use StoredOptometryCase
  onViewDetails: (caseId: string) => void; // Pass ID for consistency
  onDelete: (caseId: string) => void;
  // isAnalyzing is handled by the parent page for the modal
}

export function CaseCard({ caseData, onViewDetails, onDelete }: CaseCardProps) {
  const displayDate = format(new Date(caseData.timestamp), 'MMM d, yyyy, h:mm a');
  const patientName = (caseData.firstName || caseData.lastName) ? `${caseData.firstName} ${caseData.lastName}`.trim() : `Case: ${caseData.id.substring(0, 8)}...`;

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl truncate">{patientName}</CardTitle>
        <CardDescription className="flex items-center text-sm pt-1">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Logged: {displayDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <p className="line-clamp-2">
          <span className="font-medium text-foreground">Complaint:</span> {caseData.chiefComplaint || 'N/A'}
        </p>
        <p className="line-clamp-2">
          <span className="font-medium text-foreground">Assessment:</span> {caseData.assessment || 'N/A'}
        </p>
         {caseData.analysis && (
            <Badge variant="secondary" className="mt-2 text-xs">AI Analyzed</Badge>
        )}
        {caseData.analysisError && (
            <Badge variant="destructive" className="mt-2 text-xs">AI Error</Badge>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(caseData.id)}>
          <FileSearch className="mr-2 h-4 w-4" /> View / Analyze
        </Button>
        {/* Delete button will be part of an AlertDialog in the parent component for confirmation */}
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(caseData.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
