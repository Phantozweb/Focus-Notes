
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
import ReactMarkdown from 'react-markdown';

import { 
  Eye, Glasses, ShieldCheck, FileText, Brain, Lightbulb, AlertTriangle, Loader2, 
  User as UserIcon, Calendar, Briefcase, History, Microscope, ScanEye, Edit3, NotebookPen, UserCircle, Phone, Mail, MapPin, Pill, Info, Users, ArrowLeft,
  Send, Bot, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { analyzeOptometryCase } from '@/ai/flows/analyze-optometry-case';
import { chatWithCase } from '@/ai/flows/chat-with-case-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DetailItem = ({ icon: Icon, label, value, isFullWidth = false, isPreWrap = false }: { icon: React.ElementType, label: string, value?: string | number | null | Date, isFullWidth?: boolean, isPreWrap?: boolean }) => {
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

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const caseId = params.id as string;
  const chatScrollAreaRef = React.useRef<HTMLDivElement>(null);

  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const [currentCase, setCurrentCase] = React.useState<StoredOptometryCase | null | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [currentUserQuery, setCurrentUserQuery] = React.useState('');
  const [isSendingQuery, setIsSendingQuery] = React.useState(false);

  React.useEffect(() => {
    if (caseId && storedCases.length > 0) {
      const foundCase = storedCases.find(c => c.id === caseId);
      setCurrentCase(foundCase || null);
    } else if (caseId && storedCases.length === 0 && typeof window !== 'undefined' && localStorage.getItem('optometryCases')) {
      // Fallback for initial load if storedCases state isn't populated yet
      const casesFromStorage = JSON.parse(localStorage.getItem('optometryCases') || '[]');
      const foundCase = casesFromStorage.find((c: StoredOptometryCase) => c.id === caseId);
      setCurrentCase(foundCase || null);
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
    const aiInput: AnalyzeOptometryCaseInput = {
      visualAcuity: `OD: ${currentCase.visualAcuityCorrectedOD || currentCase.visualAcuityUncorrectedOD || 'N/A'}, OS: ${currentCase.visualAcuityCorrectedOS || currentCase.visualAcuityUncorrectedOS || 'N/A'}`,
      refraction: `OD: ${currentCase.manifestRefractionOD || 'N/A'}, OS: ${currentCase.manifestRefractionOS || 'N/A'}`,
      ocularHealthStatus: currentCase.assessment || 'Not specified',
      additionalNotes: `Chief Complaint: ${currentCase.chiefComplaint}. Hx Present Illness: ${currentCase.presentIllnessHistory || 'N/A'}. Internal Notes: ${currentCase.internalNotes || 'N/A'}. Age: ${currentCase.age || 'N/A'}.`,
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

  const prepareCaseSummaryString = (caseData: StoredOptometryCase): string => {
    let summary = `Optometry Case Summary for Patient: ${caseData.name}\n`;
    summary += `Logged: ${format(new Date(caseData.timestamp), 'PPPp')}\n\n`;

    const fieldsToInclude: (keyof StoredOptometryCase)[] = [
      'patientId', 'name', 'age', 'gender', 'contactNumber', 'email', 'address', 
      'chiefComplaint', 'presentIllnessHistory', 'pastOcularHistory', 'pastMedicalHistory',
      'familyOcularHistory', 'familyMedicalHistory', 'medications', 'allergies',
      'visualAcuityUncorrectedOD', 'visualAcuityUncorrectedOS', 'visualAcuityCorrectedOD', 'visualAcuityCorrectedOS',
      'pupils', 'extraocularMotility', 'intraocularPressureOD', 'intraocularPressureOS', 'confrontationVisualFields',
      'manifestRefractionOD', 'manifestRefractionOS', 'cycloplegicRefractionOD', 'cycloplegicRefractionOS',
      'currentSpectacleRx', 'currentContactLensRx',
      'lidsLashesOD', 'lidsLashesOS', 'conjunctivaScleraOD', 'conjunctivaScleraOS', 'corneaOD', 'corneaOS',
      'anteriorChamberOD', 'anteriorChamberOS', 'irisOD', 'irisOS', 'lensOD', 'lensOS',
      'vitreousOD', 'vitreousOS', 'opticDiscOD', 'opticDiscOS', 'cupDiscRatioOD', 'cupDiscRatioOS',
      'maculaOD', 'maculaOS', 'vesselsOD', 'vesselsOS', 'peripheryOD', 'peripheryOS',
      'octFindings', 'visualFieldFindings', 'fundusPhotographyFindings', 'otherInvestigations',
      'assessment', 'plan', 'prognosis', 'followUp', 'internalNotes', 'reflection'
    ];
    
    fieldsToInclude.forEach(key => {
      const value = caseData[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Format label
        if (value instanceof Date) { 
            summary += `${label}: ${format(new Date(value), 'PPP')}\n`;
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

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentUserQuery.trim(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentUserQuery('');
    setIsSendingQuery(true);

    const caseSummary = prepareCaseSummaryString(currentCase);
    const historyForAI: GenkitChatMessage[] = chatMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const aiInput: ChatWithCaseInput = {
      caseSummary,
      userQuery: newUserMessage.content,
      chatHistory: historyForAI,
    };

    try {
      const result = await chatWithCase(aiInput);
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.aiResponse,
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Chat AI Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with Focus AI.';
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
      };
      setChatMessages(prev => [...prev, errorResponse]);
      toast({ title: 'Focus AI Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSendingQuery(false);
    }
  };


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
  const patientName = currentCase.name ? currentCase.name.trim() : `Case ID: ${currentCase.id.substring(0,8)}...`;

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
                    <DetailItem icon={UserIcon} label="Name" value={currentCase.name} />
                    <DetailItem icon={UserIcon} label="Age" value={currentCase.age} />
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

                {/* Other sections for Examination, Slit Lamp etc. would go here, similar to the CaseDetailModal logic */}
                 <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Eye className="mr-2 h-5 w-5" />Examination & Refraction</h3>
                  {/* Details to be added here based on StoredOptometryCase fields */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Microscope className="mr-2 h-5 w-5" />Slit Lamp Examination</h3>
                   {/* Details to be added here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><ScanEye className="mr-2 h-5 w-5" />Posterior Segment Examination</h3>
                   {/* Details to be added here */}
                </section>
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><FileText className="mr-2 h-5 w-5" />Investigations</h3>
                   {/* Details to be added here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Edit3 className="mr-2 h-5 w-5" />Assessment & Plan</h3>
                   {/* Details to be added here */}
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><NotebookPen className="mr-2 h-5 w-5" />Notes & Reflection</h3>
                   {/* Details to be added here */}
                </section>


                {/* Initial AI Insights Section */}
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

                  {analysisError && !analysis?.caseInsights && (
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

                {/* Chat with Focus AI Section */}
                <section>
                    <Accordion type="single" collapsible className="w-full border rounded-lg shadow-md">
                        <AccordionItem value="focus-ai-chat">
                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 rounded-t-lg">
                                <div className="flex items-center text-lg font-semibold text-primary">
                                    <MessageSquare className="mr-2 h-5 w-5" /> Chat with Focus AI
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 py-3 border-t">
                                <div className="flex flex-col h-[500px] bg-background rounded-b-lg">
                                    <ScrollArea className="flex-grow p-4 space-y-4" ref={chatScrollAreaRef}>
                                        {chatMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "flex items-start gap-3 p-3 rounded-lg max-w-[85%] mb-3",
                                                    message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-muted text-muted-foreground'
                                                )}
                                            >
                                                {message.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />}
                                                <div className="flex-grow break-words prose prose-sm dark:prose-invert max-w-none">
                                                  <ReactMarkdown
                                                    components={{
                                                      p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                                      // Add more custom components if needed for specific markdown elements
                                                    }}
                                                  >
                                                    {message.content}
                                                  </ReactMarkdown>
                                                </div>
                                                {message.role === 'user' && <UserIcon className="h-6 w-6 text-primary-foreground flex-shrink-0 mt-0.5" />}
                                            </div>
                                        ))}
                                        {chatMessages.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8">
                                                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                                                <p>Ask Focus AI anything about this case!</p>
                                                <p className="text-xs mt-1">e.g., "Summarize the key findings" or "What are the potential differentials?"</p>
                                            </div>
                                        )}
                                    </ScrollArea>
                                    <div className="flex items-center gap-2 p-3 border-t bg-muted/50 rounded-b-lg">
                                        <Input
                                            type="text"
                                            placeholder="Ask Focus AI about this case..."
                                            value={currentUserQuery}
                                            onChange={(e) => setCurrentUserQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && !isSendingQuery && handleSendQuery()}
                                            className="flex-grow bg-background focus:ring-primary"
                                            disabled={isSendingQuery}
                                        />
                                        <Button onClick={handleSendQuery} disabled={isSendingQuery || !currentUserQuery.trim()} size="icon" className="rounded-lg">
                                            {isSendingQuery ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                            <span className="sr-only">Send message</span>
                                        </Button>
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

