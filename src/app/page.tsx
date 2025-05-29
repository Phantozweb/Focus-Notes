
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { NotebookPen, FolderKanban, PlusCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleNewCase = () => {
    router.push('/cases/new');
  };

  const handleViewCases = () => {
    router.push('/cases');
  };


  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 text-center bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 animate-fade-in-down">
            Focus CaseX
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Welcome to Focus CaseX<br />Your professional platform for optometry case management and learning.
          </p>
          <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Image
              src="https://placehold.co/600x350.png"
              alt="Focus CaseX platform illustration"
              width={600}
              height={350}
              className="rounded-lg shadow-2xl mx-auto"
              data-ai-hint="optometry technology interface"
              priority
            />
          </div>
        </div>
      </section>

      {/* Action Cards Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-card rounded-xl overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <NotebookPen className="h-10 w-10 text-primary" />
                  <div>
                    <CardTitle className="text-2xl text-primary">Log New Case</CardTitle>
                    <p className="text-sm text-muted-foreground">Efficient Data Entry</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <p className="text-foreground/70 mb-6">
                  Create a new optometry case record with complete patient details, findings, and AI-assisted analysis options. Streamline your workflow and build a comprehensive case library.
                </p>
              </CardContent>
              <CardFooter className="p-6 bg-transparent border-t">
                <Button className="w-full shadow-md hover:shadow-lg" size="lg" onClick={handleNewCase}>
                  <PlusCircle className="mr-2 h-5 w-5" /> New Case
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-card rounded-xl overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <FolderKanban className="h-10 w-10 text-primary" />
                   <div>
                    <CardTitle className="text-2xl text-primary">View All Cases</CardTitle>
                    <p className="text-sm text-muted-foreground">Comprehensive Overview</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <p className="text-foreground/70 mb-6">
                  Access and manage your existing optometry case records. Review detailed information, track progress, and leverage insights from past cases for continuous learning and improved patient care.
                </p>
              </CardContent>
              <CardFooter className="p-6 bg-transparent border-t">
                <Button className="w-full shadow-md hover:shadow-lg" variant="outline" size="lg" onClick={handleViewCases}>
                  <ExternalLink className="mr-2 h-5 w-5" /> View Cases
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
       <style jsx global>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </MainLayout>
  );
}
