
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ListChecks, PlusCircle, FileSearch, Trash2, CalendarDays, Download, AlertTriangle } from 'lucide-react';
import type { StoredOptometryCase } from '@/types/case';
import useLocalStorage from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/csv-export';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Suspense } from 'react';

interface CaseCardProps {
  caseData: StoredOptometryCase;
  onViewDetails: (caseId: string) => void;
  onDelete: (caseId: string) => void;
}

function StoredCaseCard({ caseData, onViewDetails, onDelete }: CaseCardProps) {
  const displayDate = caseData.dateOfVisit ? format(new Date(caseData.dateOfVisit), 'MMM d, yyyy') : format(new Date(caseData.timestamp), 'MMM d, yyyy');
  const patientName = caseData.name ? caseData.name.trim() : 'N/A';

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl truncate">
          {patientName !== 'N/A' ? patientName : `Case ID: ${caseData.id.substring(0, 6)}...`}
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center pt-1">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          Visited: {displayDate}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <p className="line-clamp-2"><span className="font-medium text-foreground">Complaint:</span> {caseData.chiefComplaint || 'N/A'}</p>
        <p className="line-clamp-2"><span className="font-medium text-foreground">Diagnosis:</span> {caseData.diagnosis || 'N/A'}</p>
        {caseData.analysis && (
          <Badge variant="secondary" className="mt-2 text-xs">AI Analyzed</Badge>
        )}
         {caseData.analysisError && (
          <Badge variant="destructive" className="mt-2 text-xs">AI Error</Badge>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(caseData.id)}>
          <FileSearch className="mr-2 h-4 w-4" /> View Details
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the case for {patientName}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(caseData.id)} className="bg-destructive hover:bg-destructive/90">
                Delete Case
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function ViewCasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const urlSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = React.useState(urlSearchTerm);

  React.useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  const handleViewDetails = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  const handleDeleteCase = (caseId: string) => {
    const updatedCases = storedCases.filter(c => c.id !== caseId);
    setStoredCases(updatedCases);
    toast({ title: 'Case Deleted', description: `Case ID ${caseId.substring(0,6)}... has been deleted.` });
  };
  
  const handleExport = () => {
    if (filteredCases.length === 0) {
      toast({ title: 'No Cases to Export', description: 'There are no cases to export.', variant: 'destructive' });
      return;
    }
    const casesToExport = filteredCases.map(c => {
        const flatCase: Record<string, any> = {};
        for (const [key, value] of Object.entries(c)) {
            if (Array.isArray(value)) {
                flatCase[key] = value.join('; '); // Join array values for CSV
            } else if (typeof value === 'object' && value !== null) {
                // Flatten nested objects like 'analysis'
                for (const [subKey, subValue] of Object.entries(value)) {
                    flatCase[`${key}_${subKey}`] = subValue;
                }
            }
             else {
                flatCase[key] = value;
            }
        }
        return flatCase;
    });

    // Dynamically get all possible headers
    const allHeaders = new Set<string>();
    casesToExport.forEach(c => Object.keys(c).forEach(key => allHeaders.add(key)));
    const headers = Array.from(allHeaders);
    
    const csvRows = [
        headers.join(','),
        ...casesToExport.map(row => 
            headers.map(header => {
                const value = row[header];
                const stringValue = (value === null || value === undefined) ? '' : String(value);
                return `"${stringValue.replace(/"/g, '""')}"`; 
            }).join(',')
        )
    ];
    
    exportToCsv('optometry_cases_export', csvRows.join('\r\n'));
    toast({ title: 'Cases Exported', description: 'All filtered cases have been exported to CSV.' });
  };

  const filteredCases = React.useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) return storedCases.sort((a, b) => b.timestamp - a.timestamp);
    
    return storedCases.filter(c => 
      c.id.toLowerCase().includes(lowerSearchTerm) ||
      (c.name && c.name.toLowerCase().includes(lowerSearchTerm)) ||
      (c.mrdNo && c.mrdNo.toLowerCase().includes(lowerSearchTerm)) ||
      (c.chiefComplaint && c.chiefComplaint.toLowerCase().includes(lowerSearchTerm)) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(lowerSearchTerm))
    ).sort((a, b) => b.timestamp - a.timestamp); 
  }, [storedCases, searchTerm]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/cases?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex flex-col flex-1">
      <div className="pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 max-w-7xl mx-auto w-full">
          <CardTitle className="text-3xl font-bold text-primary flex items-center order-first sm:order-none">
            <ListChecks className="mr-3 h-8 w-8" /> All Optometry Cases
          </CardTitle>
          <div className="flex gap-2 self-end sm:self-center">
            <Button onClick={() => router.push('/cases/new')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Case
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={filteredCases.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Filtered
            </Button>
          </div>
        </div>

        <Card className="shadow-xl mb-6 max-w-7xl mx-auto w-full">
          <CardContent className="pt-6">
            <form onSubmit={handleSearchSubmit}>
              <Input
                  type="text"
                  placeholder="Search cases (MRD No, Name, Complaint, Diagnosis)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
            </form>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="flex-grow pb-8">
        <div className="max-w-7xl mx-auto w-full">
          {filteredCases.length === 0 ? (
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center py-10">
                  <img 
                    src="https://picsum.photos/seed/1/400/300"
                    alt="Illustration of empty case files" 
                    data-ai-hint="empty state medical documents"
                    className="mx-auto mb-6 rounded-lg opacity-80"
                  />
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    {urlSearchTerm ? 'No Cases Match Your Search' : 'No Cases Logged Yet'}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {urlSearchTerm 
                      ? 'Try adjusting your search terms or clear the search to see all cases.' 
                      : 'Start by logging your first optometry case. It will appear here once saved.'}
                  </p>
                  {!urlSearchTerm && (
                      <Button onClick={() => router.push('/cases/new')} size="lg">
                          <PlusCircle className="mr-2 h-5 w-5" /> Log Your First Case
                      </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map((caseItem) => (
                <StoredCaseCard
                  key={caseItem.id}
                  caseData={caseItem}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteCase}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function ViewCasesPage() {
    return (
        // The MainLayout is provided by the dashboard layout
        <Suspense fallback={<div>Loading...</div>}>
            <ViewCasesContent />
        </Suspense>
    );
}
