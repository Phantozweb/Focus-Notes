
'use client';

// This component is no longer used.
// The functionality has been moved to /app/cases/[id]/page.tsx for a full-screen detail view.

// Keeping the file for now, but it can be deleted later if not repurposed.

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
import type { StoredOptometryCase } from '@/types/case'; 
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
  User, Calendar, Briefcase, History, Microscope, ScanEye, Edit3, NotebookPen, UserCircle, Phone, Mail, MapPin, Pill, Info, Users
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface CaseDetailModalProps {
  caseData: StoredOptometryCase | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (caseId: string) => void;
  isLoadingAnalysis: boolean;
}

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


export function CaseDetailModal({ caseData, isOpen, onClose, onAnalyze, isLoadingAnalysis }: CaseDetailModalProps) {
  if (!caseData) return null;

  const { analysis, analysisError } = caseData;
  const patientName = (caseData.firstName || caseData.lastName) ? `${caseData.firstName} ${caseData.lastName}`.trim() : `Case ID: ${caseData.id.substring(0,8)}...`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="border-b pb-4 pt-4 px-6 flex-shrink-0">
          <DialogTitle className="text-2xl text-primary">{patientName}</DialogTitle>
          <DialogDescription>
            Review the patient's case information and AI-powered analysis. Logged on: {format(new Date(caseData.timestamp), 'PPPp')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow min-h-0">
          <div className="space-y-8 p-6"> {/* Adjusted padding here */}
            
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><UserCircle className="mr-2 h-5 w-5" />Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={Info} label="Patient ID" value={caseData.patientId} />
                <DetailItem icon={User} label="First Name" value={caseData.firstName} />
                <DetailItem icon={User} label="Last Name" value={caseData.lastName} />
                <DetailItem icon={Calendar} label="Date of Birth" value={caseData.dateOfBirth} />
                <DetailItem icon={User} label="Gender" value={caseData.gender} />
                <DetailItem icon={Phone} label="Contact Number" value={caseData.contactNumber} />
                <DetailItem icon={Mail} label="Email" value={caseData.email} />
                <DetailItem icon={MapPin} label="Address" value={caseData.address} isFullWidth isPreWrap />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Briefcase className="mr-2 h-5 w-5" />Chief Complaint & HPI</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={Briefcase} label="Chief Complaint" value={caseData.chiefComplaint} isFullWidth isPreWrap />
                <DetailItem icon={History} label="History of Present Illness" value={caseData.presentIllnessHistory} isFullWidth isPreWrap />
              </div>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><History className="mr-2 h-5 w-5" />Medical & Ocular History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={Eye} label="Past Ocular History" value={caseData.pastOcularHistory} isFullWidth isPreWrap />
                <DetailItem icon={ShieldCheck} label="Past Medical History" value={caseData.pastMedicalHistory} isFullWidth isPreWrap />
                <DetailItem icon={Users} label="Family Ocular History" value={caseData.familyOcularHistory} isFullWidth isPreWrap />
                <DetailItem icon={Users} label="Family Medical History" value={caseData.familyMedicalHistory} isFullWidth isPreWrap />
                <DetailItem icon={Pill} label="Medications" value={caseData.medications} isFullWidth isPreWrap />
                <DetailItem icon={AlertTriangle} label="Allergies" value={caseData.allergies} isFullWidth isPreWrap />
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
                      <TableCell>{caseData.visualAcuityUncorrectedOD || 'N/A'}</TableCell>
                      <TableCell>{caseData.visualAcuityUncorrectedOS || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Corrected VA (BCVA/PH)</TableCell>
                      <TableCell>{caseData.visualAcuityCorrectedOD || 'N/A'}</TableCell>
                      <TableCell>{caseData.visualAcuityCorrectedOS || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Manifest Refraction</TableCell>
                      <TableCell className="whitespace-pre-wrap font-mono text-xs">{caseData.manifestRefractionOD || 'N/A'}</TableCell>
                      <TableCell className="whitespace-pre-wrap font-mono text-xs">{caseData.manifestRefractionOS || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cycloplegic Refraction</TableCell>
                      <TableCell className="whitespace-pre-wrap font-mono text-xs">{caseData.cycloplegicRefractionOD || 'N/A'}</TableCell>
                      <TableCell className="whitespace-pre-wrap font-mono text-xs">{caseData.cycloplegicRefractionOS || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                    <DetailItem icon={Eye} label="Pupils" value={caseData.pupils} isFullWidth isPreWrap />
                    <DetailItem icon={Eye} label="Extraocular Motility (EOMs)" value={caseData.extraocularMotility} isFullWidth isPreWrap />
                    <ODOSDetailItem icon={Eye} label="Intraocular Pressure (IOP)" valueOD={caseData.intraocularPressureOD} valueOS={caseData.intraocularPressureOS} />
                    <DetailItem icon={Eye} label="Confrontation Visual Fields" value={caseData.confrontationVisualFields} isFullWidth isPreWrap />
                    <DetailItem icon={Glasses} label="Current Spectacle Rx" value={caseData.currentSpectacleRx} isFullWidth isPreWrap />
                    <DetailItem icon={Glasses} label="Current Contact Lens Rx" value={caseData.currentContactLensRx} isFullWidth isPreWrap />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Microscope className="mr-2 h-5 w-5" />Slit Lamp Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                <ODOSDetailItem icon={Microscope} label="Lids & Lashes" valueOD={caseData.lidsLashesOD} valueOS={caseData.lidsLashesOS} isPreWrap />
                <ODOSDetailItem icon={Microscope} label="Conjunctiva & Sclera" valueOD={caseData.conjunctivaScleraOD} valueOS={caseData.conjunctivaScleraOS} isPreWrap />
                <ODOSDetailItem icon={Microscope} label="Cornea" valueOD={caseData.corneaOD} valueOS={caseData.corneaOS} isPreWrap />
                <ODOSDetailItem icon={Microscope} label="Anterior Chamber" valueOD={caseData.anteriorChamberOD} valueOS={caseData.anteriorChamberOS} isPreWrap />
                <ODOSDetailItem icon={Microscope} label="Iris" valueOD={caseData.irisOD} valueOS={caseData.irisOS} isPreWrap />
                <ODOSDetailItem icon={Microscope} label="Lens" valueOD={caseData.lensOD} valueOS={caseData.lensOS} isPreWrap />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><ScanEye className="mr-2 h-5 w-5" />Posterior Segment Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 border rounded-lg bg-card/50">
                <ODOSDetailItem icon={ScanEye} label="Vitreous" valueOD={caseData.vitreousOD} valueOS={caseData.vitreousOS} isPreWrap />
                <ODOSDetailItem icon={ScanEye} label="Optic Disc" valueOD={caseData.opticDiscOD} valueOS={caseData.opticDiscOS} isPreWrap />
                <ODOSDetailItem icon={ScanEye} label="Cup/Disc Ratio" valueOD={caseData.cupDiscRatioOD} valueOS={caseData.cupDiscRatioOS} />
                <ODOSDetailItem icon={ScanEye} label="Macula" valueOD={caseData.maculaOD} valueOS={caseData.maculaOS} isPreWrap />
                <ODOSDetailItem icon={ScanEye} label="Vessels" valueOD={caseData.vesselsOD} valueOS={caseData.vesselsOS} isPreWrap />
                <ODOSDetailItem icon={ScanEye} label="Periphery (Dilated)" valueOD={caseData.peripheryOD} valueOS={caseData.peripheryOS} isPreWrap />
              </div>
            </section>
            
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><BookOpenText className="mr-2 h-5 w-5" />Investigations</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={BookOpenText} label="OCT Findings" value={caseData.octFindings} isFullWidth isPreWrap />
                <DetailItem icon={BookOpenText} label="Visual Field Findings" value={caseData.visualFieldFindings} isFullWidth isPreWrap />
                <DetailItem icon={BookOpenText} label="Fundus Photography Findings" value={caseData.fundusPhotographyFindings} isFullWidth isPreWrap />
                <DetailItem icon={BookOpenText} label="Other Investigations" value={caseData.otherInvestigations} isFullWidth isPreWrap />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Edit3 className="mr-2 h-5 w-5" />Assessment & Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={Edit3} label="Assessment / Diagnoses" value={caseData.assessment} isFullWidth isPreWrap/>
                <DetailItem icon={Edit3} label="Plan" value={caseData.plan} isFullWidth isPreWrap />
                <DetailItem icon={Edit3} label="Prognosis" value={caseData.prognosis} isFullWidth isPreWrap />
                <DetailItem icon={Edit3} label="Follow Up Instructions" value={caseData.followUp} isFullWidth isPreWrap />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><NotebookPen className="mr-2 h-5 w-5" />Notes & Reflection</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 border rounded-lg bg-card/50">
                <DetailItem icon={NotebookPen} label="Internal Notes" value={caseData.internalNotes} isFullWidth isPreWrap />
                <DetailItem icon={NotebookPen} label="Personal Reflection/Learning" value={caseData.reflection} isFullWidth isPreWrap />
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-primary flex items-center"><Brain className="mr-2 h-5 w-5" />AI Analysis</h3>
                {(!analysis || analysisError) && (
                  <Button onClick={() => onAnalyze(caseData.id)} disabled={isLoadingAnalysis} size="sm">
                    {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {isLoadingAnalysis ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>
                )}
              </div>

              {isLoadingAnalysis && !analysis && !analysisError && (
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
                  <Button onClick={() => onAnalyze(caseData.id)} disabled={isLoadingAnalysis} size="sm" variant="outline" className="mt-2">
                    {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
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
                   <Button onClick={() => onAnalyze(caseData.id)} disabled={isLoadingAnalysis} size="sm" variant="outline" className="mt-4">
                    {isLoadingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                    {isLoadingAnalysis ? 'Re-analyzing...' : 'Re-run AI Analysis'}
                  </Button>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4 border-t flex-shrink-0 px-6 pb-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
