
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import useLocalStorage from '@/hooks/use-local-storage';
import type { StoredOptometryCase, AnalyzeOptometryCaseInput } from '@/types/case';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Eye, Glasses, ShieldCheck, FileText, Brain, BookOpenText, Lightbulb, AlertTriangle, Loader2, Link as LinkIcon,
  User, Calendar, Briefcase, History, Microscope, ScanEye, Edit3, NotebookPen, UserCircle, Phone, Mail, MapPin, Pill, Info, Users, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { analyzeOptometryCase } from '@/ai/flows/analyze-optometry-case';
import { useToast } from '@/hooks/use-toast';

const DetailItem = ({ icon: Icon, label, value, isFullWidth = false, isPreWrap = false }: { icon: React.ElementType, label: string, value?: string | null | Date, isFullWidth?: boolean, isPreWrap?: boolean }) => {
  if (!value && value !== 0 && typeof value !== 'boolean') return null; 
  
  let displayValue: string | React.ReactNode = value instanceof Date ? format(new Date(value), 'PPP') : String(value);

  if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) && label.toLowerCase().includes('url')) {
    displayValue = <Link href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value}</Link>;
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

  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const [currentCase, setCurrentCase] = React.useState<StoredOptometryCase | null | undefined>(undefined); // undefined for loading state
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (caseId && storedCases.length > 0) {
      const foundCase = storedCases.find(c => c.id === caseId);
      setCurrentCase(foundCase || null); // null if not found
    } else if (caseId && storedCases.length === 0 && localStorage.getItem('optometryCases')) {
      // Handles case where storedCases might not be hydrated yet from localStorage on initial load
      const casesFromStorage = JSON.parse(localStorage.getItem('optometryCases') || '[]');
      const foundCase = casesFromStorage.find((c: StoredOptometryCase) => c.id === caseId);
      setCurrentCase(foundCase || null);
    }
  }, [caseId, storedCases]);

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
        c.id === caseId ? { ...c, analysis: analysisResult, analysisError: undefined } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: analysisResult, analysisError: undefined } : null);
      toast({ title: 'AI Analysis Complete', description: 'Case analysis has been updated.' });
    } catch (error) {
      console.error('AI Analysis Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI analysis.';
      const updatedCases = storedCases.map(c =>
        c.id === caseId ? { ...c, analysis: undefined, analysisError: errorMessage } : c
      );
      setStoredCases(updatedCases);
      setCurrentCase(prev => prev ? { ...prev, analysis: undefined, analysisError: errorMessage } : null);
      toast({ title: 'AI Analysis Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
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
  const patientName = (currentCase.firstName || currentCase.lastName) ? `${currentCase.firstName} ${currentCase.lastName}`.trim() : `Case ID: ${currentCase.id.substring(0,8)}...`;

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between mb-2">
              <Button variant="outline" size="icon" onClick={() => router.push('/cases')} className="mr-4">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Cases</span>
              </Button>
              <div className="flex-grow">
                <CardTitle className="text-2xl md:text-3xl text-primary">{patientName}</CardTitle>
                <CardDescription>
                  Review the patient's case information. Logged on: {format(new Date(currentCase.timestamp), 'PPPp')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[calc(100vh-18rem)] md:h-[calc(100vh-16rem)]"> {/* Adjust height as needed */}
              <div className="space-y-8 pr-4">
                
                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5" />Patient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Info} label="Patient ID" value={currentCase.patientId} />
                    <DetailItem icon={User} label="First Name" value={currentCase.firstName} />
                    <DetailItem icon={User} label="Last Name" value={currentCase.lastName} />
                    <DetailItem icon={Calendar} label="Date of Birth" value={currentCase.dateOfBirth} />
                    <DetailItem icon={User} label="Gender" value={currentCase.gender} />
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
                  <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px] font-semibold text-foreground">Finding</TableHead>
                          <TableHead className="font-semibold text-foreground">OD (Right Eye)</TableHead>
                          <TableHead className="font-semibold text-foreground">OS (Left Eye)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Uncorrected VA (UCVA)</TableCell>
                          <TableCell>{currentCase.visualAcuityUncorrectedOD || 'N/A'}</TableCell>
                          <TableCell>{currentCase.visualAcuityUncorrectedOS || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Corrected VA (BCVA/PH)</TableCell>
                          <TableCell>{currentCase.visualAcuityCorrectedOD || 'N/A'}</TableCell>
                          <TableCell>{currentCase.visualAcuityCorrectedOS || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Manifest Refraction</TableCell>
                          <TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.manifestRefractionOD || 'N/A'}</TableCell>
                          <TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.manifestRefractionOS || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Cycloplegic Refraction</TableCell>
                          <TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.cycloplegicRefractionOD || 'N/A'}</TableCell>
                          <TableCell className="whitespace-pre-wrap font-mono text-xs">{currentCase.cycloplegicRefractionOS || 'N/A'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                        <DetailItem icon={Eye} label="Pupils" value={currentCase.pupils} isFullWidth isPreWrap />
                        <DetailItem icon={Eye} label="Extraocular Motility (EOMs)" value={currentCase.extraocularMotility} isFullWidth isPreWrap />
                        <ODOSDetailItem icon={Eye} label="Intraocular Pressure (IOP)" valueOD={currentCase.intraocularPressureOD} valueOS={currentCase.intraocularPressureOS} />
                        <DetailItem icon={Eye} label="Confrontation Visual Fields" value={currentCase.confrontationVisualFields} isFullWidth isPreWrap />
                        <DetailItem icon={Glasses} label="Current Spectacle Rx" value={currentCase.currentSpectacleRx} isFullWidth isPreWrap />
                        <DetailItem icon={Glasses} label="Current Contact Lens Rx" value={currentCase.currentContactLensRx} isFullWidth isPreWrap />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Microscope className="mr-2 h-5 w-5" />Slit Lamp Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                    <ODOSDetailItem icon={Microscope} label="Lids & Lashes" valueOD={currentCase.lidsLashesOD} valueOS={currentCase.lidsLashesOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Conjunctiva & Sclera" valueOD={currentCase.conjunctivaScleraOD} valueOS={currentCase.conjunctivaScleraOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Cornea" valueOD={currentCase.corneaOD} valueOS={currentCase.corneaOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Anterior Chamber" valueOD={currentCase.anteriorChamberOD} valueOS={currentCase.anteriorChamberOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Iris" valueOD={currentCase.irisOD} valueOS={currentCase.irisOS} isPreWrap />
                    <ODOSDetailItem icon={Microscope} label="Lens" valueOD={currentCase.lensOD} valueOS={currentCase.lensOS} isPreWrap />
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
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><BookOpenText className="mr-2 h-5 w-5" />Investigations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={BookOpenText} label="OCT Findings" value={currentCase.octFindings} isFullWidth isPreWrap />
                    <DetailItem icon={BookOpenText} label="Visual Field Findings" value={currentCase.visualFieldFindings} isFullWidth isPreWrap />
                    <DetailItem icon={BookOpenText} label="Fundus Photography Findings" value={currentCase.fundusPhotographyFindings} isFullWidth isPreWrap />
                    <DetailItem icon={BookOpenText} label="Other Investigations" value={currentCase.otherInvestigations} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Edit3 className="mr-2 h-5 w-5" />Assessment & Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={Edit3} label="Assessment / Diagnoses" value={currentCase.assessment} isFullWidth isPreWrap/>
                    <DetailItem icon={Edit3} label="Plan" value={currentCase.plan} isFullWidth isPreWrap />
                    <DetailItem icon={Edit3} label="Prognosis" value={currentCase.prognosis} isFullWidth isPreWrap />
                    <DetailItem icon={Edit3} label="Follow Up Instructions" value={currentCase.followUp} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><NotebookPen className="mr-2 h-5 w-5" />Notes & Reflection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                    <DetailItem icon={NotebookPen} label="Internal Notes" value={currentCase.internalNotes} isFullWidth isPreWrap />
                    <DetailItem icon={NotebookPen} label="Personal Reflection/Learning" value={currentCase.reflection} isFullWidth isPreWrap />
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5" />AI Analysis</h3>
                    {(!analysis || analysisError) && (
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                      </Button>
                    )}
                  </div>

                  {isAnalyzing && !analysis && !analysisError && (
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
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-2">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        Retry Analysis
                      </Button>
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
                                {article.url && (
                                  <Link href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1">
                                    Read Article <LinkIcon className="h-3 w-3" />
                                  </Link>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No specific research articles found by AI for this case.</p>
                        )}
                      </div>
                      <Button onClick={handleAnalyzeCase} disabled={isAnalyzing} size="sm" variant="outline" className="mt-4">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                        {isAnalyzing ? 'Re-analyzing...' : 'Re-run AI Analysis'}
                      </Button>
                    </div>
                  )}
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
