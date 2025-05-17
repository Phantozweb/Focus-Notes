
'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ListChecks } from 'lucide-react';

export default function ViewCasesPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <ListChecks className="mr-3 h-8 w-8" /> All Optometry Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <img 
                src="https://placehold.co/400x300.png" 
                alt="Illustration of case files" 
                data-ai-hint="case files documents" 
                className="mx-auto mb-6 rounded-lg opacity-80"
              />
              <h2 className="text-2xl font-semibold text-foreground mb-3">Case Listing Coming Soon</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This section will display all your logged optometry cases. You'll be able to search, filter, and view details for each case.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
