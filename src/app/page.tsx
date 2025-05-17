
'use client';

import { useState, useEffect } from 'react';
import type { OptometryCase, AnalyzedOptometryCase } from '@/types/case';
import useLocalStorage from '@/hooks/use-local-storage';
import { exportToCsv } from '@/lib/csv-export';
import { analyzeOptometryCase, AnalyzeOptometryCaseInput } from '@/ai/flows/analyze-optometry-case';

import { MainLayout } from '@/components/layout/main-layout';
import { CaseList } from '@/components/case-list';
import { CaseForm } from '@/components/case-form';
import { CaseDetailModal } from '@/components/case-detail-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader'; // Added import for Loader
import { PlusCircle } from 'lucide-react';

export default function HomePage() {
  const [cases, setCases] = useLocalStorage<AnalyzedOptometryCase[]>('optometryCases', []);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<AnalyzedOptometryCase | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogNewCase = () => {
    setIsFormModalOpen(true);
  };

  const handleSaveCase = (data: Omit<OptometryCase, 'id' | 'timestamp'>) => {
    setIsSavingCase(true);
    try {
      const newCase: AnalyzedOptometryCase = {
        ...data,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      setCases(prevCases => [newCase, ...prevCases]);
      toast({ title: "Case Saved", description: "New optometry case successfully logged." });
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Error saving case:", error);
      toast({ variant: "destructive", title: "Save Error", description: "Failed to save the case." });
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleDeleteCase = (caseId: string) => {
    setCases(prevCases => prevCases.filter(c => c.id !== caseId));
    toast({ title: "Case Deleted", description: "The case has been removed." });
    if (selectedCaseForDetail?.id === caseId) {
      setIsDetailModalOpen(false);
      setSelectedCaseForDetail(null);
    }
  };

  const handleViewDetails = (caseData: AnalyzedOptometryCase) => {
    setSelectedCaseForDetail(caseData);
    setIsDetailModalOpen(true);
  };

  const handleAnalyzeCase = async (caseId: string) => {
    const caseToAnalyze = cases.find(c => c.id === caseId);
    if (!caseToAnalyze) {
      toast({ variant: "destructive", title: "Error", description: "Case not found for analysis." });
      return;
    }

    setIsLoadingAnalysis(true);
    if (selectedCaseForDetail?.id === caseId) { // Ensure modal reflects loading if it's the current one
       setSelectedCaseForDetail(prev => prev ? {...prev, analysisError: undefined } : null);
    }


    try {
      const analysisInput: AnalyzeOptometryCaseInput = {
        visualAcuity: caseToAnalyze.visualAcuity,
        refraction: caseToAnalyze.refraction,
        ocularHealthStatus: caseToAnalyze.ocularHealthStatus,
        additionalNotes: caseToAnalyze.additionalNotes || '',
      };
      const analysisResult = await analyzeOptometryCase(analysisInput);
      
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, analysis: analysisResult, analysisError: undefined } : c
        )
      );
      
      if (selectedCaseForDetail?.id === caseId) {
        setSelectedCaseForDetail(prev => prev ? { ...prev, analysis: analysisResult, analysisError: undefined } : null);
      }
      toast({ title: "Analysis Complete", description: "AI analysis has been added to the case." });

    } catch (error) {
      console.error("Error analyzing case:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI analysis.";
      setCases(prevCases =>
        prevCases.map(c =>
          c.id === caseId ? { ...c, analysis: undefined, analysisError: errorMessage } : c
        )
      );
      if (selectedCaseForDetail?.id === caseId) {
         setSelectedCaseForDetail(prev => prev ? { ...prev, analysis: undefined, analysisError: errorMessage } : null);
      }
      toast({ variant: "destructive", title: "Analysis Failed", description: errorMessage });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleExportCases = () => {
    if (cases.length === 0) {
      toast({ title: "No Cases", description: "There are no cases to export."});
      return;
    }
    try {
      exportToCsv('focuscase_ai_exports', cases);
      toast({ title: "Export Successful", description: "Cases have been exported to CSV."});
    } catch (error) {
      console.error("Error exporting cases:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not export cases."});
    }
  };

  if (!hydrated) {
    // Render a loading state or null until hydrated to prevent hydration mismatch
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader size={48} text="Loading FocusCase AI..." />
      </div>
    );
  }

  return (
    <MainLayout onLogNewCase={handleLogNewCase}>
      <CaseList
        cases={cases}
        onSelectCase={handleViewDetails}
        onAnalyzeCase={handleAnalyzeCase}
        onDeleteCase={handleDeleteCase}
        onExportCases={handleExportCases}
        onLogNewCase={handleLogNewCase}
        analyzingCaseId={isLoadingAnalysis ? selectedCaseForDetail?.id : null}
      />

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Log New Optometry Case</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new case.
            </DialogDescription>
          </DialogHeader>
          <CaseForm
            onSubmit={handleSaveCase}
            onCancel={() => setIsFormModalOpen(false)}
            isLoading={isSavingCase}
          />
        </DialogContent>
      </Dialog>

      {selectedCaseForDetail && (
        <CaseDetailModal
          caseData={selectedCaseForDetail}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            // setTimeout(() => setSelectedCaseForDetail(null), 300); // Delay clearing to allow modal fade out
          }}
          onAnalyze={handleAnalyzeCase}
          isLoadingAnalysis={isLoadingAnalysis && selectedCaseForDetail?.id === cases.find(c => c.analysisError !== undefined || c.analysis !== undefined)?.id}
        />
      )}
    </MainLayout>
  );
}
