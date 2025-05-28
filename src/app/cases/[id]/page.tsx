
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { StoredOptometryCase, AnalyzeOptometryCaseInput, AnalyzeOptometryCaseOutput } from '@/types/case';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// import { Input } from '@/components/ui/input'; // No longer needed for chat
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // No longer needed for chat
// import ReactMarkdown from 'react-markdown'; // No longer needed for chat

import { 
  Eye, Glasses, ShieldCheck, FileText, Brain, Lightbulb, AlertTriangle, Loader2, 
  User as UserIcon, Calendar, Briefcase, History, Microscope, ScanEye, Edit3, NotebookPen, UserCircle, Phone, Mail, MapPin, Pill, Info, Users, ArrowLeft
  // Removed: Send, Bot, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { analyzeOptometryCase } from '@/ai/flows/analyze-optometry-case';
import { useToast } from '@/hooks/use-toast';
// import { cn } from '@/lib/utils'; // No longer needed if cn was only for chat

const DetailItem = ({ icon: Icon, label, value, isFullWidth = false, isPreWrap = false }: { icon: React.ElementType, label: string, value?: string | null | Date, isFullWidth?: boolean, isPreWrap?: boolean }) => {
  if (!value && value !== 0 && typeof value !== 'boolean') return null; 
  
  let displayValue: string | React.ReactNode = value instanceof Date ? format(new Date(value), 'PPP') : String(value);

  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) && label.toLowerCase().includes('url')) {
    displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>;
  } else if (isPreWrap) {
    displayValue = <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words">{String(value)}</pre>;
  } else {
     displayValue = <p className="text-sm text-muted-foreground break-words">{String(value)}</p>;
  }

  return (
    <div className={isFullWidth ? "md:col-span-2" : ""}>
      <h4 className="font-medium flex items-center gap-1.5 mb-1 text-foreground">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />{label}:
      </h4>
      {displayValue}
    </div>
  );
};

const ODOSDetailItem = ({ icon: Icon, label, valueOD, valueOS, isPreWrap = false }: { icon: React.ElementType, label: string, valueOD?: string | null, valueOS?: string | null, isPreWrap?: boolean }) => {
  if ((!valueOD && valueOD !==0 && typeof valueOD !== 'boolean') && (!valueOS && valueOS !==0 && typeof valueOS !== 'boolean')) return null;
  return (
    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      <h4 className="font-medium flex items-center gap-1.5 text-foreground sm:col-span-2 mb-1">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />{label}:
      </h4>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">OD (Right Eye)</p>
        {isPreWrap ? <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words">{valueOD || 'N/A'}</pre> : <p className="text-sm text-muted-foreground break-words">{valueOD || 'N/A'}</p>}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">OS (Left Eye)</p>
        {isPreWrap ? <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words">{valueOS || 'N/A'}</pre> : <p className="text-sm text-muted-foreground break-words">{valueOS || 'N/A'}</p>}
      </div>
    </div>
  );
};

// Removed prepareCaseSummaryString function as it was for the chat AI

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const caseId = params.id as string;
  // const chatScrollAreaRef = React.useRef<HTMLDivElement>(null); // No longer needed

  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const [currentCase, setCurrentCase] = React.useState<StoredOptometryCase | null | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Chat state removed
  // const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  // const [currentUserQuery, setCurrentUserQuery] = React.useState('');
  // const [isSendingQuery, setIsSendingQuery] = React.useState(false);

  React.useEffect(() => {
    if (caseId && storedCases.length > 0) {
      const foundCase = storedCases.find(c => c.id === caseId);
      setCurrentCase(foundCase || null);
    } else if (caseId && storedCases.length === 0 && typeof window !== 'undefined' && localStorage.getItem('optometryCases')) {
      const casesFromStorage = JSON.parse(localStorage.getItem('optometryCases') || '[]');
      const foundCase = casesFromStorage.find((c: StoredOptometryCase) => c.id === caseId);
      setCurrentCase(foundCase || null);
    }
  }, [caseId, storedCases]);

  // Chat scroll effect removed
  // React.useEffect(() => {
  //   if (chatScrollAreaRef.current) {
  //     chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
  //   }
  // }, [chatMessages]);

  const handleAnalyzeCase = async () => {
    if (!currentCase) return;
    setIsAnalyzing(true);
    const aiInput: AnalyzeOptometryCaseInput = {
      visualAcuity: `OD: ${currentCase.visualAcuityCorrectedOD || currentCase.visualAcuityUncorrectedOD || 'N/A'}, OS: ${currentCase.visualAcuityCorrectedOS || currentCase.visualAcuityUncorrectedOS || 'N/A'}`,
      refraction: `OD: ${currentCase.manifestRefractionOD || 'N/A'}, OS: ${currentCase.manifestRefractionOS || 'N/A'}`,
      ocularHealthStatus: currentCase.assessment || 'Not specified',
      additionalNotes: `Chief Complaint: ${currentCase.chiefComplaint}. Hx Present Illness: ${currentCase.presentIllnessHistory || 'N/A'}. Internal Notes: ${currentCase.internalNotes || 'N/A'}.`,
    };

    try {
      const analysisResult = await analyzeOptometryCase(aiInput);
      const updatedCases = storedCases.map(c =>
        c.id === caseId ? { ...c, analysis: analysisResult as AnalyzeOptometryCaseOutput, analysisError: undefined } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: analysisResult as AnalyzeOptometryCaseOutput, analysisError: undefined } : null);
      toast({ title: 'AI Insights Updated', description: 'Case insights have been refreshed.' });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI analysis.';
      const updatedCases = storedCases.map(c =>
        c.id === caseId ? { ...c, analysis: undefined, analysisError: errorMessage } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: undefined, analysisError: errorMessage } : null);
      toast({ title: 'AI Insights Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // handleSendQuery function removed

  if (currentCase === undefined) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!currentCase) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Button variant="outline" onClick={() => router.push('/cases')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
          </Button>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Case Not Found</AlertTitle>
            <AlertDescription>The requested case could not be found. It might have been deleted.</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }
  
  const { analysis, analysisError } = currentCase;
  const patientName = (currentCase.firstName || currentCase.lastName) ? `${currentCase.firstName} ${currentCase.lastName}`.trim() : `Case ID: ${currentCase.id.substring(0,8)}...`;

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-2">
              <Button variant="outline" size="icon" onClick={() => router.push('/cases')} className="mr-4 flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Cases</span>
              </Button>
              <div className="flex-grow min-w-0">
                <CardTitle className="text-2xl md:text-3xl text-primary truncate" title={patientName}>{patientName}</CardTitle>
                <CardDescription>
                  Review the patient's case information. Logged on: {format(new Date(currentCase.timestamp), 'PPPp')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[calc(100vh-18rem)] md:h-[calc(100vh-16rem)]">
              <div className="space-y-8 pr-4">
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5" />Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Info} label="Patient ID" value={currentCase.patientId} />
                    <DetailItem icon={UserIcon} label="First Name" value={currentCase.firstName} />
                    <DetailItem icon={UserIcon} label="Last Name" value={currentCase.lastName} />
                    <DetailItem icon={Calendar} label="Date of Birth" value={currentCase.dateOfBirth} />
                    <DetailItem icon={UserIcon} label="Gender" value={currentCase.gender} />
                    <DetailItem icon={Phone} label="Contact Number" value={currentCase.contactNumber} />
                    <DetailItem icon={Mail} label="Email" value={currentCase.email} />
                    <DetailItem icon={MapPin} label="Address" value={currentCase.address} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Briefcase className="mr-2 h-5 w-5" />Chief Complaint & HPI</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Briefcase} label="Chief Complaint" value={currentCase.chiefComplaint} isFullWidth isPreWrap />
                    <DetailItem icon={History} label="History of Present Illness" value={currentCase.presentIllnessHistory} isFullWidth isPreWrap />
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><History className="mr-2 h-5 w-5" />Medical & Ocular History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Eye} label="Past Ocular History" value={currentCase.pastOcularHistory} isFullWidth isPreWrap />
                    <DetailItem icon={ShieldCheck} label="Past Medical History" value={currentCase.pastMedicalHistory} isFullWidth isPreWrap />
                    <DetailItem icon={Users} label="Family Ocular History" value={currentCase.familyOcularHistory} isFullWidth isPreWrap />
                    <DetailItem icon={Users} label="Family Medical History" value={currentCase.familyMedicalHistory} isFullWidth isPreWrap />
                    <DetailItem icon={Pill} label="Medications" value={currentCase.medications} isFullWidth isPreWrap />
                    <DetailItem icon={AlertTriangle} label="Allergies" value={currentCase.allergies} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Eye className="mr-2 h-5 w-5" />Examination & Refraction</h3>
                  {/* Table and other details will go here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Microscope className="mr-2 h-5 w-5" />Slit Lamp Examination</h3>
                  {/* ODOSDetailItems go here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><ScanEye className="mr-2 h-5 w-5" />Posterior Segment Examination</h3>
                  {/* ODOSDetailItems go here */}
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><FileText className="mr-2 h-5 w-5" />Investigations</h3> {/* Changed icon from BookOpenText */}
                  {/* DetailItems go here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Edit3 className="mr-2 h-5 w-5" />Assessment & Plan</h3>
                   {/* DetailItems go here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><NotebookPen className="mr-2 h-5 w-5" />Notes & Reflection</h3>
                   {/* DetailItems go here */}
                </section>

                {/* Original AI Analysis (Insights only now) */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5" />Initial AI Insights</h3>
                    {(!analysis || analysisError) && (
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Analyzing...' : 'Get Initial Insights'}
                      </Button>
                    )}
                  </div>

                  {isAnalyzing && !analysis && !analysisError && (
                    <div className="flex items-center justify-center p-8 border rounded-lg bg-card/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-3 text-muted-foreground">AI is generating insights...</p>
                    </div>
                  )}

                  {analysisError && !analysis?.caseInsights && ( // Show error only if no insights
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Insights Error</AlertTitle>
                      <AlertDescription>{analysisError}</AlertDescription>
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-2">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Retry Insights
                      </Button>
                    </Alert>
                  )}

                  {analysis?.caseInsights && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                      <div>
                        <h4 className="font-medium flex items-center gap-1 mb-2"><Lightbulb className="h-5 w-5 text-accent" />Case Insights:</h4>
                        <p className="text-sm bg-accent/10 p-3 rounded-md text-foreground/90 whitespace-pre-wrap">{analysis.caseInsights}</p>
                      </div>
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-4">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Re-analyzing...' : 'Refresh Insights'}
                      </Button>
                    </div>
                  )}
                </section>

                {/* Chat with Focus AI Section REMOVED */}

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

