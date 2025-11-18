
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, PlusCircle, ListChecks, FileText, Activity, BrainCircuit, BarChart3, Users, FileSearch, Trash2, CalendarDays, Download, NotebookPen, Search, Globe, ChevronRight, ScanLine } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { StoredOptometryCase } from '@/types/case';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { trackActivity } from '@/lib/tracker';

// Dashboard-specific components
const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const RecentCaseItem = ({ caseData, onViewDetails }: { caseData: StoredOptometryCase; onViewDetails: (id: string) => void }) => {
  const patientName = caseData.name ? caseData.name.trim() : `Case ID: ${caseData.id.substring(0, 6)}...`;
  const displayDate = caseData.dateOfVisit ? format(new Date(caseData.dateOfVisit), 'MMM d, yyyy') : format(new Date(caseData.timestamp), 'MMM d, yyyy');

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onViewDetails(caseData.id)}
    >
      <div className="flex-grow min-w-0">
        <p className="font-semibold truncate text-foreground">{patientName}</p>
        <p className="text-xs text-muted-foreground">{displayDate} &bull; {caseData.chiefComplaint?.substring(0, 40) || 'N/A'}{caseData.chiefComplaint && caseData.chiefComplaint.length > 40 ? '...' : ''}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {caseData.analysis && <Badge variant="secondary" className="hidden sm:inline-flex">AI Analyzed</Badge>}
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};

// All-Cases-specific components
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

const CommunityTemplateItem = ({ name, description, onClick }: { name: string, description: string, onClick: () => void }) => (
  <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors">
    <div>
      <p className="font-semibold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClick}>
      <ChevronRight className="h-5 w-5" />
    </Button>
  </div>
);


function TemplatesContent() {
  const router = useRouter();
  
  const communityTemplates = [
    { id: 'default', name: "General Case", description: "Comprehensive template for routine exams." },
    { id: 'follow-up', name: "Follow-up Visit", description: "For tracking progress and managing ongoing conditions." },
    { id: 'orthoptics', name: "Orthoptics Assessment", description: "Focused workup for strabismus and amblyopia." },
    { id: 'contact-lens', name: "Contact Lens Fitting", description: "For new fittings and follow-ups." },
    { id: 'dry-eye', name: "Dry Eye Workup", description: "Detailed assessment for ocular surface disease." },
    { id: 'myopia-management', name: "Myopia Management", description: "Tracking and managing myopic progression." },
    { id: 'pediatric', name: "Pediatric Exam", description: "Tailored for examining children." },
    { id: 'neuro-optometry', name: "Neuro-Optometry & Rehab", description: "For TBI, stroke, and other neurological cases." },
    { id: 'low-vision', name: "Low Vision Assessment", description: "For patients requiring low vision aids and rehabilitation." },
    { id: 'certificate', name: "Certificate Purpose", description: "For driving license, employment, and other fitness certificates." },
  ];

  const handleTemplateClick = (templateId: string) => {
    trackActivity('Template Selected', `User selected the "${templateId}" template to start a new case.`);
    router.push(`/cases/new?template=${templateId}`);
  };
  
  React.useEffect(() => {
    trackActivity('Page View: Templates', 'User is viewing the templates page.');
  }, []);

  return (
    <div className="h-full flex flex-col">
       <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <NotebookPen className="mr-3 h-8 w-8" /> Templates
            </CardTitle>
            <CardDescription className="mt-1">
              Create a new case by selecting a template.
            </CardDescription>
          </div>
        </div>
        <div className="flex-1 relative">
            <div className="absolute inset-0">
                <ScrollArea className="h-full">
                    <div className="p-4 sm:p-6 lg:p-8 pt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">My Templates</CardTitle>
                                    <CardDescription>Your saved case templates.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                    <h3 className="mt-4 text-lg font-semibold text-foreground">Custom Templates Coming Soon</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Soon, you'll be able to create and save your own templates here.
                                    </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Community Templates</CardTitle>
                                    <CardDescription>Select a template to start a new case.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                    {communityTemplates.map((template) => (
                                        <CommunityTemplateItem
                                        key={template.id}
                                        name={template.name}
                                        description={template.description}
                                        onClick={() => handleTemplateClick(template.id)}
                                        />
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ScrollArea>
            </div>
       </div>
    </div>
  );
}


function DashboardContent() {
  const router = useRouter();
  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    trackActivity('Page View: Dashboard', 'User has landed on the main dashboard.');
  }, []);

  const stats = React.useMemo(() => {
    const totalCases = storedCases.length;
    const aiAnalyzed = storedCases.filter(c => !!c.analysis).length;
    return { totalCases, aiAnalyzed };
  }, [storedCases]);
  
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackActivity('Case Search Initiated', `User searched for: "${searchTerm}" from dashboard.`);
    if (searchTerm.trim()) {
      router.push(`/dashboard?view=cases&search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/dashboard?view=cases');
    }
  };
  
  const recentCases = React.useMemo(() => {
    return [...storedCases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [storedCases]);

  const handleViewDetails = (caseId: string) => {
    trackActivity('View Case Details', `User clicked to view case ID: ${caseId} from recent cases.`);
    router.push(`/cases/${caseId}`);
  };
  
  const handleQuickActionClick = (path: string, action: string) => {
    trackActivity('Quick Action Clicked', `User clicked on: "${action}"`);
    router.push(path);
  };

  return (
    <main className="container py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome, User!</h1>
        <p className="text-muted-foreground">Here's a quick overview of your case activity.</p>
      </div>
      
      <Card className="shadow-xl mb-8">
          <CardContent className="pt-6">
              <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                      <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          type="text"
                          placeholder="Search all cases and view list..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10"
                      />
                  </div>
              </form>
          </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Cases" value={stats.totalCases} icon={ListChecks} />
        <StatCard title="AI-Analyzed Cases" value={stats.aiAnalyzed} icon={BrainCircuit} />
        <StatCard title="Coming Soon" value="..." icon={BarChart3} />
        <StatCard title="Coming Soon" value="..." icon={Users} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
              <Button size="lg" onClick={() => handleQuickActionClick('/cases/new?template=default', 'Log a New General Case')}>
                <PlusCircle className="mr-2 h-5 w-5" /> Log a New General Case
              </Button>
               <Button size="lg" variant="outline" onClick={() => handleQuickActionClick('/dashboard?view=templates', 'Choose from Templates')}>
                <NotebookPen className="mr-2 h-5 w-5" /> Choose from Templates
              </Button>
               <Button size="lg" variant="outline" onClick={() => handleQuickActionClick('/dashboard?view=cases', 'View All Case Records')}>
                <ListChecks className="mr-2 h-5 w-5" /> View All Case Records
              </Button>
              <Button size="lg" variant="outline" onClick={() => handleQuickActionClick('/cases/scan', 'Convert Physical Case Sheet')}>
                <ScanLine className="mr-2 h-5 w-5" /> Convert Physical Case Sheet
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Recent Cases</CardTitle>
               <CardDescription>
                Your 5 most recently logged cases. Select one to view details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentCases.length > 0 ? (
                <div className="divide-y divide-border -mx-3">
                  {recentCases.map(caseData => (
                    <RecentCaseItem key={caseData.id} caseData={caseData} onViewDetails={handleViewDetails} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No Cases Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your recent cases will appear here once you log them.
                  </p>
                  <Button className="mt-6" onClick={() => handleQuickActionClick('/cases/new?template=default', 'Log Your First Case')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Log Your First Case
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function AllCasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  
  const urlSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = React.useState(urlSearchTerm);
  
  React.useEffect(() => {
    trackActivity('Page View: All Cases', 'User is viewing the list of all case records.');
  }, []);

  React.useEffect(() => {
    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

  const handleViewDetails = (caseId: string) => {
    trackActivity('View Case Details', `User clicked to view case ID: ${caseId} from all cases list.`);
    router.push(`/cases/${caseId}`);
  };

  const handleDeleteCase = (caseId: string) => {
    const caseToDelete = storedCases.find(c => c.id === caseId);
    setStoredCases(storedCases.filter(c => c.id !== caseId));
    trackActivity('Case Deleted', `Case for "${caseToDelete?.name || 'N/A'}" (ID: ${caseId}) was deleted.`);
    toast({ title: 'Case Deleted', description: `Case ID ${caseId.substring(0,6)}... has been deleted.` });
  };
  
  const handleExport = () => {
    if (filteredCases.length === 0) {
      toast({ title: 'No Cases to Export', description: 'There are no cases to export.', variant: 'destructive' });
      return;
    }
    trackActivity('Export Cases', `User exported ${filteredCases.length} cases to CSV.`);
    const casesToExport = filteredCases.map(c => {
        const flatCase: Record<string, any> = {};
        for (const [key, value] of Object.entries(c)) {
            if (Array.isArray(value)) {
                flatCase[key] = value.join('; ');
            } else if (typeof value === 'object' && value !== null) {
                for (const [subKey, subValue] of Object.entries(value)) {
                    flatCase[`${key}_${subKey}`] = subValue;
                }
            } else {
                flatCase[key] = value;
            }
        }
        return flatCase;
    });

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
    
    exportToCsv('optometry_cases_export', csvRows.join('
'));
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
    trackActivity('Case Search Initiated', `User searched for: "${searchTerm}"`);
    router.push(`/dashboard?view=cases&search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="container flex-shrink-0 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 w-full">
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <ListChecks className="mr-3 h-8 w-8" /> Case Records
          </CardTitle>
        </div>

        <Card className="shadow-xl mb-6 w-full">
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
        
        <div className="flex gap-2 mb-6">
            <Button onClick={() => { trackActivity('Action: Log New Case', 'User clicked "Log New Case" from All Cases page.'); router.push('/cases/new?template=default'); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Log New Case
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={filteredCases.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Filtered
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow pb-8">
        <div className="container w-full">
          {filteredCases.length === 0 ? (
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <div className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h2 className="text-2xl font-semibold text-foreground mb-3 mt-4">
                    {urlSearchTerm ? 'No Cases Match Your Search' : 'No Cases Logged Yet'}
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {urlSearchTerm
                      ? 'Try adjusting your search terms or clear the search to see all cases.'
                      : 'Start by logging your first optometry case. It will appear here once you have saved it.'}
                  </p>
                  {!urlSearchTerm && (
                      <Button onClick={() => router.push('/cases/new?template=default')} size="lg">
                          <PlusCircle className="mr-2 h-5 w-5" /> Log Your First Case
                      </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

const PageContent = () => {
    const searchParams = useSearchParams();
    const view = searchParams.get('view');

    if (view === 'cases') {
        return <AllCasesContent />;
    }

    if (view === 'templates') {
        return <TemplatesContent />;
    }

    return <DashboardContent />;
};

const DynamicPageContent = dynamic(() => Promise.resolve(PageContent), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p>Loading Dashboard...</p>
    </div>
  ),
});

export default function DashboardPageContent() {
    return (
        <Suspense fallback={
            <div className="flex h-full w-full items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Loading...</p>
            </div>
        }>
            <DynamicPageContent />
        </Suspense>
    );
}
