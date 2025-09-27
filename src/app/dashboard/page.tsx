
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, PlusCircle, ListChecks, FileText, Activity, BrainCircuit, BarChart3, Users, FileSearch } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { StoredOptometryCase } from '@/types/case';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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

export default function DashboardPage() {
  const router = useRouter();
  const memoizedInitialCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialCases);
  const [searchTerm, setSearchTerm] = React.useState('');

  const stats = React.useMemo(() => {
    const totalCases = storedCases.length;
    const aiAnalyzed = storedCases.filter(c => !!c.analysis).length;
    // Add more stats as needed
    return { totalCases, aiAnalyzed };
  }, [storedCases]);
  
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/cases?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/cases');
    }
  };
  
  const recentCases = React.useMemo(() => {
    return [...storedCases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [storedCases]);

  const handleViewDetails = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  return (
    <main className="container py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground">Here's a quick overview of your case activity.</p>
      </div>
      
      <Card className="shadow-xl mb-8">
          <CardContent className="pt-6">
              <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                      <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                          type="text"
                          placeholder="Search all cases (MRD No, Name, Complaint, Diagnosis)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10"
                      />
                  </div>
              </form>
          </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Cases" value={stats.totalCases} icon={ListChecks} />
        <StatCard title="AI-Analyzed Cases" value={stats.aiAnalyzed} icon={BrainCircuit} />
        <StatCard title="Coming Soon" value="..." icon={BarChart3} />
        <StatCard title="Coming Soon" value="..." icon={Users} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
              <Button size="lg" onClick={() => router.push('/cases/new')}>
                <PlusCircle className="mr-2 h-5 w-5" /> Log a New Case
              </Button>
               <Button size="lg" variant="outline" onClick={() => router.push('/cases')}>
                <ListChecks className="mr-2 h-5 w-5" /> View All Cases
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases */}
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
                  <Button className="mt-6" onClick={() => router.push('/cases/new')}>
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
