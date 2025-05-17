'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, Brain, Trash2, CalendarDays } from "lucide-react";
import type { OptometryCase } from "@/types/case";
import { Badge } from "@/components/ui/badge";

interface CaseCardProps {
  caseData: OptometryCase;
  onViewDetails: (caseData: OptometryCase) => void;
  onAnalyze: (caseId: string) => void;
  onDelete: (caseId: string) => void;
  isAnalyzing?: boolean;
}

export function CaseCard({ caseData, onViewDetails, onAnalyze, onDelete, isAnalyzing }: CaseCardProps) {
  const displayDate = new Date(caseData.timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl">Case: {caseData.id.substring(0, 8)}...</CardTitle>
        <CardDescription className="flex items-center text-sm">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          Logged on: {displayDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">VA:</span> {caseData.visualAcuity}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Rx:</span> {caseData.refraction}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
             <span className="font-medium text-foreground">Ocular Health:</span> {caseData.ocularHealthStatus}
          </p>
           {(caseData as any).analysis && (
            <Badge variant="secondary" className="mt-2">AI Analyzed</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(caseData)}>
            <FileSearch className="mr-2 h-4 w-4" /> View / Analyze
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(caseData.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
