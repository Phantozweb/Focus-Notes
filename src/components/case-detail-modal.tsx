'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AnalyzedOptometryCase } from '@/types/case';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, Glasses, ShieldCheck, FileText, Brain, BookOpenText, Lightbulb, AlertTriangle, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

interface CaseDetailModalProps {
  caseData: AnalyzedOptometryCase | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (caseId: string) => void;
  isLoadingAnalysis: boolean;
}

export function CaseDetailModal({ caseData, isOpen, onClose, onAnalyze, isLoadingAnalysis }: CaseDetailModalProps) {
  if (!caseData) return null;

  const { visualAcuity, refraction, ocularHealthStatus, additionalNotes, analysis, analysisError } = caseData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Case Details: {caseData.id.substring(0,8)}...</DialogTitle>
          <DialogDescription>
            Review the patient's case information and AI-powered analysis.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><FileText className="mr-2 h-5 w-5" />Case Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
                <div>
                  <h4 className="font-medium flex items-center gap-1 mb-1"><Eye className="h-4 w-4 text-muted-foreground" />Visual Acuity:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{visualAcuity}</p>
                </div>
                <div>
                  <h4 className="font-medium flex items-center gap-1 mb-1"><Glasses className="h-4 w-4 text-muted-foreground" />Refraction:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{refraction}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium flex items-center gap-1 mb-1"><ShieldCheck className="h-4 w-4 text-muted-foreground" />Ocular Health Status:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ocularHealthStatus}</p>
                </div>
                {additionalNotes && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium flex items-center gap-1 mb-1"><FileText className="h-4 w-4 text-muted-foreground" />Additional Notes:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{additionalNotes}</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5" />AI Analysis</h3>
                {!analysis && !analysisError && (
                  <Button onClick={() => onAnalyze(caseData.id)} disabled={isLoadingAnalysis} size="sm">
                    {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {isLoadingAnalysis ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>
                )}
              </div>

              {isLoadingAnalysis && !analysis && (
                <div className="flex items-center justify-center p-8 border rounded-lg bg-card/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3 text-muted-foreground">AI is analyzing the case...</p>
                </div>
              )}

              {analysisError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Analysis Error</AlertTitle>
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              {analysis && (
                <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                  <div>
                    <h4 className="font-medium flex items-center gap-1 mb-2"><Lightbulb className="h-5 w-5 text-accent" />Case Insights:</h4>
                    <p className="text-sm bg-accent/10 p-3 rounded-md text-accent-foreground/80 whitespace-pre-wrap">{analysis.caseInsights}</p>
                  </div>
                  <div>
                    <h4 className="font-medium flex items-center gap-1 mb-2"><BookOpenText className="h-5 w-5 text-accent" />Relevant Research Articles:</h4>
                    {analysis.relevantResearchArticles.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.relevantResearchArticles.map((article, index) => (
                          <li key={index} className="p-3 border rounded-md bg-background hover:shadow-md transition-shadow">
                            <h5 className="font-semibold text-primary">{article.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1 mb-2 whitespace-pre-wrap">{article.summary}</p>
                            <Link href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">
                              Read Article <LinkIcon className="h-3 w-3" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific research articles found by AI for this case.</p>
                    )}
                  </div>
                   <Button onClick={() => onAnalyze(caseData.id)} disabled={isLoadingAnalysis} size="sm" variant="outline" className="mt-4">
                    {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {isLoadingAnalysis ? 'Re-analyzing...' : 'Re-run AI Analysis'}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
