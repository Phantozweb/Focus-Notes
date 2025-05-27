
'use client';

import * as React from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ListChecks, PlusCircle, FileSearch, Brain, Trash2, CalendarDays, Download, AlertTriangle, Loader2 } from 'lucide-react';
import type { StoredOptometryCase, OptometryCase as AIInputCase } from '@/types/case';
import useLocalStorage from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/csv-export';
import { CaseDetailModal } from '@/components/case-detail-modal';
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
import { analyzeOptometryCase, type AnalyzeOptometryCaseInput, type AnalyzeOptometryCaseOutput } from '@/ai/flows/analyze-optometry-case';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


interface CaseCardProps {
  caseData: StoredOptometryCase;
  onViewDetails: (caseId: string) => void;
  onDelete: (caseId: string) => void;
  isAnalyzing?: boolean; // To show loading state on this specific card if needed
}

function StoredCaseCard({ caseData, onViewDetails, onDelete }: CaseCardProps) {
  const displayDate = format(new Date(caseData.timestamp), 'MMM d, yyyy, h:mm a');
  const patientName = (caseData.firstName || caseData.lastName) ? `${caseData.firstName} ${caseData.lastName}`.trim() : 'N/A';

  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl truncate">
          {patientName !== 'N/A' ? patientName : `Case ID: ${caseData.id.substring(0, 6)}...`}
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center pt-1">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          Logged: {displayDate}
        </p>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        <p className="line-clamp-2"><span className="font-medium text-foreground">Complaint:</span> {caseData.chiefComplaint || 'N/A'}</p>
        <p className="line-clamp-2"><span className="font-medium text-foreground">Assessment:</span> {caseData.assessment || 'N/A'}</p>
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


export default function ViewCasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  const [selectedCase, setSelectedCase] = React.useState<StoredOptometryCase | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');


  const handleViewDetails = (caseId: string) => {
    const caseToView = storedCases.find(c => c.id === caseId);
    if (caseToView) {
      setSelectedCase(caseToView);
      setIsModalOpen(true);
    }
  };

  const handleDeleteCase = (caseId: string) => {
    const updatedCases = storedCases.filter(c => c.id !== caseId);
    setStoredCases(updatedCases);
    toast({ title: 'Case Deleted', description: `Case ID ${caseId.substring(0,6)}... has been deleted.` });
  };
  
  const handleExport = () => {
    if (storedCases.length === 0) {
      toast({ title: 'No Cases to Export', description: 'There are no cases logged to export.', variant: 'destructive' });
      return;
    }
    // Map StoredOptometryCase to the simpler OptometryCase for CSV if needed, or export all fields
    const casesToExport = filteredCases.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        patientId: c.patientId || '',
        firstName: c.firstName,
        lastName: c.lastName,
        dateOfBirth: format(new Date(c.dateOfBirth), 'yyyy-MM-dd'),
        gender: c.gender || '',
        contactNumber: c.contactNumber || '',
        email: c.email || '',
        address: c.address || '',
        chiefComplaint: c.chiefComplaint,
        presentIllnessHistory: c.presentIllnessHistory || '',
        pastOcularHistory: c.pastOcularHistory || '',
        pastMedicalHistory: c.pastMedicalHistory || '',
        familyOcularHistory: c.familyOcularHistory || '',
        familyMedicalHistory: c.familyMedicalHistory || '',
        medications: c.medications || '',
        allergies: c.allergies || '',
        visualAcuityUncorrectedOD: c.visualAcuityUncorrectedOD || '',
        visualAcuityUncorrectedOS: c.visualAcuityUncorrectedOS || '',
        visualAcuityCorrectedOD: c.visualAcuityCorrectedOD || '',
        visualAcuityCorrectedOS: c.visualAcuityCorrectedOS || '',
        pupils: c.pupils || '',
        extraocularMotility: c.extraocularMotility || '',
        intraocularPressureOD: c.intraocularPressureOD || '',
        intraocularPressureOS: c.intraocularPressureOS || '',
        confrontationVisualFields: c.confrontationVisualFields || '',
        manifestRefractionOD: c.manifestRefractionOD || '',
        manifestRefractionOS: c.manifestRefractionOS || '',
        cycloplegicRefractionOD: c.cycloplegicRefractionOD || '',
        cycloplegicRefractionOS: c.cycloplegicRefractionOS || '',
        currentSpectacleRx: c.currentSpectacleRx || '',
        currentContactLensRx: c.currentContactLensRx || '',
        lidsLashesOD: c.lidsLashesOD || '',
        lidsLashesOS: c.lidsLashesOS || '',
        conjunctivaScleraOD: c.conjunctivaScleraOD || '',
        conjunctivaScleraOS: c.conjunctivaScleraOS || '',
        corneaOD: c.corneaOD || '',
        corneaOS: c.corneaOS || '',
        anteriorChamberOD: c.anteriorChamberOD || '',
        anteriorChamberOS: c.anteriorChamberOS || '',
        irisOD: c.irisOD || '',
        irisOS: c.irisOS || '',
        lensOD: c.lensOD || '',
        lensOS: c.lensOS || '',
        vitreousOD: c.vitreousOD || '',
        vitreousOS: c.vitreousOS || '',
        opticDiscOD: c.opticDiscOD || '',
        opticDiscOS: c.opticDiscOS || '',
        cupDiscRatioOD: c.cupDiscRatioOD || '',
        cupDiscRatioOS: c.cupDiscRatioOS || '',
        maculaOD: c.maculaOD || '',
        maculaOS: c.maculaOS || '',
        vesselsOD: c.vesselsOD || '',
        vesselsOS: c.vesselsOS || '',
        peripheryOD: c.peripheryOD || '',
        peripheryOS: c.peripheryOS || '',
        octFindings: c.octFindings || '',
        visualFieldFindings: c.visualFieldFindings || '',
        fundusPhotographyFindings: c.fundusPhotographyFindings || '',
        otherInvestigations: c.otherInvestigations || '',
        assessment: c.assessment,
        plan: c.plan,
        prognosis: c.prognosis || '',
        followUp: c.followUp || '',
        internalNotes: c.internalNotes || '',
        reflection: c.reflection || '',
        analysis_caseInsights: c.analysis?.caseInsights || '',
        analysis_relevantResearch_titles: c.analysis?.relevantResearchArticles.map(a => a.title).join('; ') || '',
        analysis_relevantResearch_summaries: c.analysis?.relevantResearchArticles.map(a => a.summary).join('; ') || '',
        analysis_relevantResearch_urls: c.analysis?.relevantResearchArticles.map(a => a.url).join('; ') || '',
        analysisError: c.analysisError || '',
    }));

    // Dynamically generate headers based on the actual keys in the first case object
    const headers = casesToExport.length > 0 ? Object.keys(casesToExport[0]) : [];
    
    const csvRows = [
        headers.join(','),
        ...casesToExport.map(row => 
            headers.map(header => {
                const value = (row as any)[header];
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                return `"${stringValue.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];
    
    exportToCsv('optometry_cases_export', csvRows.join('\r\n'));
    toast({ title: 'Cases Exported', description: 'All filtered cases have been exported to CSV.' });
  };

  const handleAnalyzeCase = async (caseId: string) => {
    const caseToAnalyze = storedCases.find(c => c.id === caseId);
    if (!caseToAnalyze) {
      toast({ title: 'Error', description: 'Case not found for analysis.', variant: 'destructive'});
      return;
    }

    setIsAnalyzing(true);

    // Prepare input for the AI flow
    const aiInput: AnalyzeOptometryCaseInput = {
      visualAcuity: `OD: ${caseToAnalyze.visualAcuityCorrectedOD || caseToAnalyze.visualAcuityUncorrectedOD || 'N/A'}, OS: ${caseToAnalyze.visualAcuityCorrectedOS || caseToAnalyze.visualAcuityUncorrectedOS || 'N/A'}`,
      refraction: `OD: ${caseToAnalyze.manifestRefractionOD || 'N/A'}, OS: ${caseToAnalyze.manifestRefractionOS || 'N/A'}`,
      ocularHealthStatus: caseToAnalyze.assessment || 'Not specified', // Use assessment as primary source
      additionalNotes: `Chief Complaint: ${caseToAnalyze.chiefComplaint}. Hx Present Illness: ${caseToAnalyze.presentIllnessHistory || 'N/A'}. Internal Notes: ${caseToAnalyze.internalNotes || 'N/A'}.`,
    };
    
    try {
      const analysisResult = await analyzeOptometryCase(aiInput);
      const updatedCases = storedCases.map(c => 
        c.id === caseId ? { ...c, analysis: analysisResult, analysisError: undefined } : c
      );
      setStoredCases(updatedCases);
      setSelectedCase(prev => prev && prev.id === caseId ? { ...prev, analysis: analysisResult, analysisError: undefined } : prev);
      toast({ title: 'AI Analysis Complete', description: 'Case analysis has been updated.' });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI analysis.';
      const updatedCases = storedCases.map(c => 
        c.id === caseId ? { ...c, analysis: undefined, analysisError: errorMessage } : c
      );
      setStoredCases(updatedCases);
      setSelectedCase(prev => prev && prev.id === caseId ? { ...prev, analysis: undefined, analysisError: errorMessage } : prev);
      toast({ title: 'AI Analysis Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredCases = React.useMemo(() => {
    if (!searchTerm) return storedCases;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return storedCases.filter(c => 
      c.id.toLowerCase().includes(lowerSearchTerm) ||
      c.firstName.toLowerCase().includes(lowerSearchTerm) ||
      c.lastName.toLowerCase().includes(lowerSearchTerm) ||
      (c.patientId && c.patientId.toLowerCase().includes(lowerSearchTerm)) ||
      c.chiefComplaint.toLowerCase().includes(lowerSearchTerm) ||
      c.assessment.toLowerCase().includes(lowerSearchTerm)
    ).sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [storedCases, searchTerm]);


  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
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

        <Card className="shadow-xl mb-6">
          <CardContent className="pt-6">
             <Input
                type="text"
                placeholder="Search cases (ID, Name, Complaint, Assessment)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
          </CardContent>
        </Card>


        {filteredCases.length === 0 ? (
           <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center py-10">
                <img 
                  src="https://placehold.co/400x300.png" 
                  alt="Illustration of empty case files" 
                  data-ai-hint="empty state medical documents"
                  className="mx-auto mb-6 rounded-lg opacity-80"
                />
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  {searchTerm ? 'No Cases Match Your Search' : 'No Cases Logged Yet'}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchTerm 
                    ? 'Try adjusting your search terms or clear the search to see all cases.' 
                    : 'Start by logging your first optometry case. It will appear here once saved.'}
                </p>
                {!searchTerm && (
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
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAnalyze={handleAnalyzeCase}
          isLoadingAnalysis={isAnalyzing}
        />
      )}
    </MainLayout>
  );
}
