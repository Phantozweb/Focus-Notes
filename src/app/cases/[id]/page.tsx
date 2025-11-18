
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { StoredOptometryCase, AnalyzeOptometryCaseInput, AnalyzeOptometryCaseOutput, ChatMessage, GenkitChatMessage, ChatWithCaseInput } from '@/types/case';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReactMarkdown from 'react-markdown';
import { 
  Eye, Glasses, ShieldCheck, FileText, Brain, Lightbulb, AlertTriangle, Loader2, 
  User as UserIcon, Calendar, Briefcase, History, Microscope, ScanEye, Edit3, NotebookPen, UserCircle, Phone, Mail, MapPin, Pill, Info, Users, ArrowLeft,
  Send, Bot, MessageSquare, Baby, HelpCircle, Activity, Clock, ListChecks
} from 'lucide-react';
import { format } from 'date-fns';
import { analyzeOptometryCase } from '@/ai/flows/analyze-optometry-case';
import { chatWithCase } from '@/ai/flows/chat-with-case-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { trackActivity } from '@/lib/tracker';

const DetailItem = ({ icon: Icon, label, value, isFullWidth = false, isPreWrap = false }: { icon: React.ElementType, label: string, value?: string | number | null | Date, isFullWidth?: boolean, isPreWrap?: boolean }) => {
  const isValuePresent = value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : true);
  const shouldDisplayValue = (typeof value === 'number' && value === 0) || typeof value === 'boolean' || isValuePresent;

  let displayValueNode: React.ReactNode;

  if (shouldDisplayValue) {
    if (value instanceof Date) {
      displayValueNode = <p className="text-sm text-muted-foreground break-words">{format(new Date(value), 'PPP')}</p>;
    } else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) && label.toLowerCase().includes('url')) {
      displayValueNode = <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</a>;
    } else if (isPreWrap) {
      displayValueNode = <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words">{String(value)}</pre>;
    } else {
      displayValueNode = <p className="text-sm text-muted-foreground break-words">{String(value)}</p>;
    }
  } else {
    displayValueNode = <p className="text-sm text-muted-foreground italic">N/A</p>;
  }

  return (
    <div className={isFullWidth ? "md:col-span-2" : ""}>
      <h4 className="font-medium flex items-center gap-1.5 mb-1 text-foreground">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />{label}:
      </h4>
      {displayValueNode}
    </div>
  );
};

const ODOSDetailItem = ({ icon: Icon, label, valueOD, valueOS, isPreWrap = false }: { icon: React.ElementType, label: string, valueOD?: string | null, valueOS?: string | null, isPreWrap?: boolean }) => {
  const odDisplay = valueOD !== null && valueOD !== undefined && (typeof valueOD === 'string' ? valueOD.trim() !== '' : true) ? String(valueOD) : 'N/A';
  const osDisplay = valueOS !== null && valueOS !== undefined && (typeof valueOS === 'string' ? valueOS.trim() !== '' : true) ? String(valueOS) : 'N/A';

  return (
    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      <h4 className="font-medium flex items-center gap-1.5 text-foreground sm:col-span-2 mb-1">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />{label}:
      </h4>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">OD (Right Eye)</p>
        {isPreWrap ? <pre className={cn("text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words", odDisplay === 'N/A' && "italic")}>{odDisplay}</pre> : <p className={cn("text-sm text-muted-foreground break-words", odDisplay === 'N/A' && "italic")}>{odDisplay}</p>}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">OS (Left Eye)</p>
        {isPreWrap ? <pre className={cn("text-sm text-muted-foreground whitespace-pre-wrap font-sans break-words", osDisplay === 'N/A' && "italic")}>{osDisplay}</pre> : <p className={cn("text-sm text-muted-foreground break-words", osDisplay === 'N/A' && "italic")}>{osDisplay}</p>}
      </div>
    </div>
  );
};

export default function CaseDetailPage() {
  const router = useRouter();
  const routerParams = useParams(); 
  const { toast } = useToast();
  const chatScrollAreaRef = React.useRef<HTMLDivElement>(null);

  const [plainParams, setPlainParams] = React.useState<{ id?: string | string[] } | null>(null);

  React.useEffect(() => {
    if (routerParams) {
      const newPlainParams: { id?: string | string[] } = {};
      if (routerParams.id) {
        newPlainParams.id = routerParams.id;
      }
      setPlainParams(newPlainParams);
    } else {
      setPlainParams(null);
    }
  }, [routerParams]);

  const caseId = React.useMemo(() => {
    if (plainParams && typeof plainParams.id === 'string') {
      return plainParams.id;
    }
    if (plainParams && Array.isArray(plainParams.id) && plainParams.id.length > 0) {
      return plainParams.id[0];
    }
    return undefined;
  }, [plainParams]);

  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const [currentCase, setCurrentCase] = React.useState<StoredOptometryCase | null | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [currentUserQuery, setCurrentUserQuery] = React.useState('');
  const [isSendingQuery, setIsSendingQuery] = React.useState(false);

  React.useEffect(() => {
    if (caseId) {
        trackActivity('Page View: Case Details', `Viewing case with ID: ${caseId}`);
    }
    if (caseId && storedCases.length > 0) {
      const foundCase = storedCases.find(c => c.id === caseId);
      setCurrentCase(foundCase || null);
    } else if (caseId && storedCases.length === 0 && typeof window !== 'undefined') {
        const item = localStorage.getItem('optometryCases');
        if (item) {
            try {
                const casesFromStorage = JSON.parse(item);
                const foundCase = casesFromStorage.find((c: StoredOptometryCase) => c.id === caseId);
                setCurrentCase(foundCase || null);
            } catch (e) {
                console.error("Error parsing cases from localStorage", e);
                setCurrentCase(null);
            }
        } else {
            setCurrentCase(null);
        }
    }
  }, [caseId, storedCases]);

  React.useEffect(() => {
    if (chatScrollAreaRef.current) {
      chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleAnalyzeCase = async () => {
    if (!currentCase) return;
    setIsAnalyzing(true);
    trackActivity('AI Action: Get Initial Insights', `Analyzing case for "${currentCase.name || 'N/A'}" (ID: ${currentCase.id}).`);
    const aiInput: AnalyzeOptometryCaseInput = {
      visualAcuity: `Final Acuity OD: ${currentCase.finalAcuityOD || 'N/A'}, OS: ${currentCase.finalAcuityOS || 'N/A'}`,
      refraction: `Subjective Rx OD: ${currentCase.subjRefractionOD || 'N/A'}, OS: ${currentCase.subjRefractionOS || 'N/A'}`,
      ocularHealthStatus: currentCase.diagnosis || 'Not specified',
      additionalNotes: `Chief Complaint: ${currentCase.chiefComplaint}. History: ${currentCase.pastOcularHistory || 'N/A'}. Allergies: ${currentCase.allergies || 'N/A'}.`,
    };

    try {
      const analysisResult = await analyzeOptometryCase(aiInput);
      const updatedCases = storedCases.map(c =>
        c.id === caseId ? { ...c, analysis: analysisResult as AnalyzeOptometryCaseOutput, analysisError: undefined } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: analysisResult as AnalyzeOptometryCaseOutput, analysisError: undefined } : null);
      trackActivity('AI Action Success: Insights Generated', `Successfully generated insights for case ID: ${currentCase.id}.`);
      toast({ title: 'AI Insights Updated', description: 'Case insights have been refreshed.' });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI analysis.';
      const updatedCases = storedCases.map(c =>
        c.id === caseId ? { ...c, analysis: undefined, analysisError: errorMessage } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: undefined, analysisError: errorMessage } : null);
      trackActivity('AI Action Failed: Insights Error', `Failed to generate insights for case ID: ${currentCase.id}.`, [{ name: 'Error', value: errorMessage }]);
      toast({ title: 'AI Insights Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prepareCaseSummaryString = (caseData: StoredOptometryCase): string => {
    let summary = `Optometry Case Summary for Patient: ${caseData.name}\n`;
    summary += `Logged: ${format(new Date(caseData.timestamp), 'PPPp')}\n\n`;
    const fieldsToInclude: (keyof StoredOptometryCase)[] = Object.keys(caseData) as (keyof StoredOptometryCase)[];
    
    fieldsToInclude.forEach(key => {
      const value = caseData[key];
      if (value !== undefined && value !== null && String(value).trim() !== '' && typeof value !== 'object') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); 
        if (key === 'dateOfVisit' && typeof value === 'number') {
            summary += `Date Of Visit: ${format(new Date(value), 'PPP')}\n`;
        } else {
            summary += `${label}: ${String(value)}\n`;
        }
      }
    });
    
    if (caseData.analysis?.caseInsights) {
        summary += `\nInitial AI Insights:\n${caseData.analysis.caseInsights}\n`;
    }
    if (caseData.analysisError) {
        summary += `\nAI Analysis Error: ${caseData.analysisError}\n`;
    }
    return summary.trim();
  };

  const handleSendQuery = async () => {
    if (!currentUserQuery.trim() || !currentCase) return;

    const userQuery = currentUserQuery.trim();
    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: userQuery };
    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentUserQuery('');
    setIsSendingQuery(true);
    trackActivity('AI Chat: User Message Sent', `Case ID: ${currentCase.id}`, [{ name: 'User Query', value: userQuery }]);

    const caseSummary = prepareCaseSummaryString(currentCase);
    const historyForAI: GenkitChatMessage[] = chatMessages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));
    
    const aiInput: ChatWithCaseInput = { caseSummary, userQuery: newUserMessage.content, chatHistory: historyForAI };

    try {
      const result = await chatWithCase(aiInput);
      const aiResponse: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.aiResponse };
      setChatMessages(prev => [...prev, aiResponse]);
      trackActivity('AI Chat: Assistant Response', `Case ID: ${currentCase.id}`, [{ name: 'Assistant Response', value: result.aiResponse.substring(0, 500) + '...' }]);
    } catch (error) {
      console.error('CRITICAL_AI_DEBUG: Chat AI Error on client:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with Focus AI.';
      const errorResponse: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}` };
      setChatMessages(prev => [...prev, errorResponse]);
      trackActivity('AI Chat: Error', `Case ID: ${currentCase.id}`, [{ name: 'Error', value: errorMessage }]);
      toast({ title: 'Focus AI Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSendingQuery(false);
    }
  };

  if (currentCase === undefined || !caseId) {
    return ( <MainLayout><div className="flex justify-center items-center h-full flex-1 py-8 px-4 sm:px-6 lg:px-8"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div></MainLayout> );
  }

  if (!currentCase) {
    return (
      <MainLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <Button variant="outline" onClick={() => router.push('/cases')} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases</Button>
          <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Case Not Found</AlertTitle><AlertDescription>The requested case could not be found. It might have been deleted.</AlertDescription></Alert>
        </div>
      </MainLayout>
    );
  }
  
  const { analysis, analysisError } = currentCase;
  const patientName = currentCase.name ? currentCase.name.trim() : `Case ID: ${currentCase.id.substring(0,8)}...`;
  const visitDate = currentCase.dateOfVisit ? new Date(currentCase.dateOfVisit) : new Date(currentCase.timestamp);

  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl max-w-7xl mx-auto">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-2">
              <Button variant="outline" size="icon" onClick={() => router.push('/cases')} className="mr-4 flex-shrink-0"><ArrowLeft className="h-5 w-5" /><span className="sr-only">Back to Cases</span></Button>
              <div className="flex-grow min-w-0">
                <CardTitle className="text-2xl md:text-3xl text-primary truncate" title={patientName}>{patientName}</CardTitle>
                <CardDescription>Review the patient's case information. Logged on: {format(visitDate, 'PPPp')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[calc(100vh-18rem)] md:h-[calc(100vh-16rem)]">
              <div className="space-y-8 pr-4">
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5" />Patient & Visit Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Briefcase} label="Posting" value={currentCase.posting} />
                    <DetailItem icon={Info} label="MRD No." value={currentCase.mrdNo} />
                    <DetailItem icon={Calendar} label="Date of Visit" value={currentCase.dateOfVisit ? new Date(currentCase.dateOfVisit) : undefined} />
                    <DetailItem icon={UserIcon} label="Name" value={currentCase.name} />
                    <DetailItem icon={UserIcon} label="Age" value={currentCase.age} />
                    <DetailItem icon={UserIcon} label="Sex" value={currentCase.sex} />
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><History className="mr-2 h-5 w-5" />Patient History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Briefcase} label="Chief Complaints" value={currentCase.chiefComplaint} isFullWidth isPreWrap />
                    <DetailItem icon={Eye} label="Past Ocular History" value={currentCase.pastOcularHistory} isFullWidth isPreWrap />
                    <DetailItem icon={Pill} label="Current Medications" value={currentCase.currentMedications} isFullWidth isPreWrap />
                    <DetailItem icon={ShieldCheck} label="Past Medical History" value={currentCase.pastMedicalHistory} isFullWidth isPreWrap />
                    <DetailItem icon={FileText} label="Recent Investigations" value={currentCase.recentInvestigations} isFullWidth isPreWrap />
                    <DetailItem icon={Users} label="Family History" value={currentCase.familyHistory} isFullWidth isPreWrap />
                    <DetailItem icon={AlertTriangle} label="Allergy History" value={currentCase.allergies} isFullWidth isPreWrap />
                    <DetailItem icon={Baby} label="Birth History" value={currentCase.birthHistory} isFullWidth isPreWrap />
                  </div>
                </section>
                
                 <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Eye className="mr-2 h-5 w-5" />Visual Acuity & Refraction</h3>
                  <div className="p-4 border rounded-lg bg-card/50 space-y-6">
                    <div>
                      <h4 className="font-medium flex items-center gap-1.5 mb-2 text-foreground"><Eye className="h-4 w-4 text-primary" />Visual Acuity</h4>
                      <Table>
                        <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>OD</TableHead><TableHead>OS</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="font-medium">Distance - Unaided</TableCell><TableCell>{currentCase.distanceUnaidedOD || 'N/A'}</TableCell><TableCell>{currentCase.distanceUnaidedOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Distance - Pinhole</TableCell><TableCell>{currentCase.distancePinholeOD || 'N/A'}</TableCell><TableCell>{currentCase.distancePinholeOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Distance - Old Glasses</TableCell><TableCell>{currentCase.distanceOldGlassesOD || 'N/A'}</TableCell><TableCell>{currentCase.distanceOldGlassesOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Near - Unaided</TableCell><TableCell>{currentCase.nearUnaidedOD || 'N/A'}</TableCell><TableCell>{currentCase.nearUnaidedOS || 'N/A'}</TableCell></TableRow>
                           <TableRow><TableCell className="font-medium">Near - Pinhole</TableCell><TableCell>{currentCase.nearPinholeOD || 'N/A'}</TableCell><TableCell>{currentCase.nearPinholeOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Near - Old Glasses</TableCell><TableCell>{currentCase.nearOldGlassesOD || 'N/A'}</TableCell><TableCell>{currentCase.nearOldGlassesOS || 'N/A'}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-1.5 my-4 text-foreground"><Glasses className="h-4 w-4 text-primary" />Refraction Details</h4>
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[180px]">Type</TableHead><TableHead>OD (Right Eye)</TableHead><TableHead>OS (Left Eye)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="font-medium">Previous Glasses (PGP)</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{`Sph: ${currentCase.pgpSphOD||'N/A'} Cyl: ${currentCase.pgpCylOD||'N/A'} Axis: ${currentCase.pgpAxisOD||'N/A'}`}</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{`Sph: ${currentCase.pgpSphOS||'N/A'} Cyl: ${currentCase.pgpCylOS||'N/A'} Axis: ${currentCase.pgpAxisOS||'N/A'}`}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Auto-Refraction</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.autoRefractionOD || 'N/A'}</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.autoRefractionOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Objective (Retinoscopy)</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.objRefractionOD || 'N/A'}</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.objRefractionOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Subjective</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.subjRefractionOD || 'N/A'}</TableCell><TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.subjRefractionOS || 'N/A'}</TableCell></TableRow>
                          <TableRow><TableCell className="font-medium">Final Acuity</TableCell><TableCell>{currentCase.finalAcuityOD || 'N/A'}</TableCell><TableCell>{currentCase.finalAcuityOS || 'N/A'}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <ODOSDetailItem icon={HelpCircle} label="Objective Findings" valueOD={currentCase.objRefractionFindingsOD?.join(', ')} valueOS={currentCase.objRefractionFindingsOS?.join(', ')} />
                    <ODOSDetailItem icon={HelpCircle} label="Subjective Checks" valueOD={currentCase.subjRefractionChecksOD?.join(', ')} valueOS={currentCase.subjRefractionChecksOS?.join(', ')} />
                    <DetailItem icon={HelpCircle} label="Final Correction Preference" value={currentCase.finalCorrectionPreference} isFullWidth />
                    <DetailItem icon={Glasses} label="Lens Type" value={currentCase.lensType} isFullWidth />
                    <ODOSDetailItem icon={Glasses} label="Prism Correction" valueOD={currentCase.prismDioptersOD ? `${currentCase.prismDioptersOD}Δ ${currentCase.prismBaseOD || ''}`.trim() : 'N/A'} valueOS={currentCase.prismDioptersOS ? `${currentCase.prismDioptersOS}Δ ${currentCase.prismBaseOS || ''}`.trim() : 'N/A'} />
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><ListChecks className="mr-2 h-5 w-5" />Ancillary Ocular Tests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <ODOSDetailItem icon={Eye} label="Keratometry - Vertical" valueOD={currentCase.keratometryVerticalOD} valueOS={currentCase.keratometryVerticalOS} />
                    <ODOSDetailItem icon={Eye} label="Keratometry - Horizontal" valueOD={currentCase.keratometryHorizontalOD} valueOS={currentCase.keratometryHorizontalOS} />
                    <DetailItem icon={FileText} label="Keratometry Comments" value={currentCase.keratometryComments} isFullWidth isPreWrap />
                    <DetailItem icon={Eye} label="Cover Test" value={currentCase.coverTest} isFullWidth />
                    <DetailItem icon={Eye} label="EOM" value={currentCase.eom} isFullWidth />
                    <DetailItem icon={Eye} label="NPC (Subj/Obj)" value={`Subj: ${currentCase.npcSubj || 'N/A'} cm / Obj: ${currentCase.npcObj || 'N/A'} cm`} isFullWidth />
                    <DetailItem icon={Eye} label="NPA (OD/OS/OU)" value={`OD: ${currentCase.npaOD || 'N/A'} D / OS: ${currentCase.npaOS || 'N/A'} D / OU: ${currentCase.npaOU || 'N/A'} D`} isFullWidth />
                    <DetailItem icon={Eye} label="WFDT (Dist/Near)" value={`Distance: ${currentCase.wfdtDistance || 'N/A'} / Near: ${currentCase.wfdtNear || 'N/A'}`} isFullWidth />
                    <DetailItem icon={Eye} label="Stereopsis" value={currentCase.stereopsis} isFullWidth />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Microscope className="mr-2 h-5 w-5" />Anterior Segment & Tonometry</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Microscope} label="Pupillary Evaluation" value={currentCase.pupillaryEvaluation} isFullWidth isPreWrap />
                    <DetailItem icon={Microscope} label="External Examination" value={currentCase.externalExamination} isFullWidth isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Lids & Lashes" valueOD={currentCase.lidsLashesOD} valueOS={currentCase.lidsLashesOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Conjunctiva & Sclera" valueOD={currentCase.conjunctivaScleraOD} valueOS={currentCase.conjunctivaScleraOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Cornea" valueOD={currentCase.corneaOD} valueOS={currentCase.corneaOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Anterior Chamber" valueOD={currentCase.anteriorChamberOD} valueOS={currentCase.anteriorChamberOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Iris" valueOD={currentCase.irisOD} valueOS={currentCase.irisOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Lens" valueOD={currentCase.lensOD} valueOS={currentCase.lensOS} isPreWrap />
                    <ODOSDetailItem icon={Eye} label="Tonometry Pressure (mmHg)" valueOD={currentCase.tonometryPressureOD} valueOS={currentCase.tonometryPressureOS} />
                    <DetailItem icon={Clock} label="Tonometry Method & Time" value={`${currentCase.tonometryMethod || 'N/A'} at ${currentCase.tonometryTime || 'N/A'}`} isFullWidth />
                    <ODOSDetailItem icon={Eye} label="TBUT (sec)" valueOD={currentCase.tbutOD} valueOS={currentCase.tbutOS} />
                    <ODOSDetailItem icon={Eye} label="Schirmer's (mm)" valueOD={currentCase.schirmerOD} valueOS={currentCase.schirmerOS} />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><ScanEye className="mr-2 h-5 w-5" />Posterior Segment Examination</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <ODOSDetailItem icon={ScanEye} label="Vitreous" valueOD={currentCase.vitreousOD} valueOS={currentCase.vitreousOS} isPreWrap />
                    <ODOSDetailItem icon={ScanEye} label="Optic Disc" valueOD={currentCase.opticDiscOD} valueOS={currentCase.opticDiscOS} isPreWrap />
                    <ODOSDetailItem icon={ScanEye} label="Cup/Disc Ratio" valueOD={currentCase.cupDiscRatioOD} valueOS={currentCase.cupDiscRatioOS} />
                    <ODOSDetailItem icon={ScanEye} label="Macula" valueOD={currentCase.maculaOD} valueOS={currentCase.maculaOS} isPreWrap />
                    <ODOSDetailItem icon={ScanEye} label="Vessels" valueOD={currentCase.vesselsOD} valueOS={currentCase.vesselsOS} isPreWrap />
                    <ODOSDetailItem icon={ScanEye} label="Periphery (Dilated)" valueOD={currentCase.peripheryOD} valueOS={currentCase.peripheryOS} isPreWrap />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Edit3 className="mr-2 h-5 w-5" />Diagnosis & Plan</h3>
                   <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Edit3} label="Diagnosis" value={currentCase.diagnosis} isFullWidth isPreWrap />
                    <DetailItem icon={Edit3} label="Intervention Planned" value={currentCase.interventionPlanned} isFullWidth isPreWrap />
                    <DetailItem icon={NotebookPen} label="Learning / Reflection" value={currentCase.learning} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5" />Initial AI Insights</h3>
                    {(!analysis || analysisError) && (<Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm">{isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}{isAnalyzing ? 'Analyzing...' : 'Get Initial Insights'}</Button>)}
                  </div>
                  {isAnalyzing && !analysis && !analysisError && (<div className="flex items-center justify-center p-8 border rounded-lg bg-card/50"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">AI is generating insights...</p></div>)}
                  {analysisError && !analysis?.caseInsights && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Insights Error</AlertTitle><AlertDescription>{analysisError}</AlertDescription><Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-2">{isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}Retry Insights</Button></Alert>)}
                  {analysis?.caseInsights && (
                    <div className="space-y-4 p-4 border rounded-lg bg-card/50">
                      <div>
                        <h4 className="font-medium flex items-center gap-1 mb-2"><Lightbulb className="h-5 w-5 text-accent" />Case Insights:</h4>
                        <p className="text-sm bg-accent/10 p-3 rounded-md text-foreground/90 whitespace-pre-wrap">{analysis.caseInsights}</p>
                      </div>
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-4">{isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}{isAnalyzing ? 'Re-analyzing...' : 'Refresh Insights'}</Button>
                    </div>
                  )}
                </section>

                <section>
                    <Accordion type="single" collapsible className="w-full border rounded-lg shadow-md">
                        <AccordionItem value="focus-ai-chat">
                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-lg"><div className="flex items-center text-lg font-semibold text-primary"><MessageSquare className="mr-2 h-5 w-5" /> Chat with Focus AI</div></AccordionTrigger>
                            <AccordionContent className="px-4 py-3 border-t">
                                <div className="flex flex-col h-[500px] bg-background rounded-b-lg">
                                    <ScrollArea className="flex-grow p-4 space-y-4" ref={chatScrollAreaRef}>
                                        {chatMessages.map((message) => (<div key={message.id} className={cn("flex items-start gap-3 p-3 rounded-lg max-w-[85%] mb-3", message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted text-muted-foreground')}>
                                                {message.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />}
                                                <div className="flex-grow break-words prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} /> }}>{message.content}</ReactMarkdown></div>
                                                {message.role === 'user' && <UserIcon className="h-6 w-6 text-primary-foreground flex-shrink-0 mt-0.5" />}
                                        </div>))}
                                        {chatMessages.length === 0 && (<div className="text-center text-muted-foreground py-8"><MessageSquare className="h-12 w-12 mx-auto mb-3 text-primary/50" /><p>Ask Focus AI anything about this case!</p><p className="text-xs mt-1">e.g., "Summarize the key findings" or "What are the potential differentials?"</p></div>)}
                                    </ScrollArea>
                                    <div className="flex items-center gap-2 p-3 border-t bg-muted/50 rounded-b-lg">
                                        <Input type="text" placeholder="Ask Focus AI about this case..." value={currentUserQuery} onChange={(e) => setCurrentUserQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isSendingQuery && handleSendQuery()} className="flex-grow bg-background focus:ring-primary" disabled={isSendingQuery} />
                                        <Button onClick={handleSendQuery} disabled={isSendingQuery || !currentUserQuery.trim()} size="icon" className="rounded-lg">{isSendingQuery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}<span className="sr-only">Send message</span></Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
