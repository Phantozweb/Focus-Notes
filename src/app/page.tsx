
'use client';

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
          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary/90 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Experience the Future of Optometry Learning with AI-Powered Case Management.
          </p>
          <p className="text-md sm:text-lg text-foreground/70 mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            Log cases manually or with intelligent AI assistance, and dive deep into interactive case reviews. Our integrated Focus AI is here to assist you at every step.
          </p>
        </div>
      </section>

      {/* Action Cards Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-card rounded-xl overflow-hidden transform hover:-translate-y-1 group">
              <CardHeader className="bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <NotebookPen className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <div>
                    <CardTitle className="text-2xl text-primary">Log New Case</CardTitle>
                    <p className="text-sm text-muted-foreground">Interactive EMR with AI Assist</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <p className="text-foreground/70 mb-6">
                  Create detailed optometry case records using our comprehensive EMR interface. Choose between manual data entry or leverage Focus AI to interactively assist you in filling out case details, saving you time and ensuring accuracy.
                </p>
              </CardContent>
              <CardFooter className="p-6 bg-transparent border-t">
                <Button className="w-full shadow-md hover:shadow-lg" size="lg" onClick={handleNewCase}>
                  <PlusCircle className="mr-2 h-5 w-5" /> New Case
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-card rounded-xl overflow-hidden transform hover:-translate-y-1 group">
              <CardHeader className="bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <FolderKanban className="h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                   <div>
                    <CardTitle className="text-2xl text-primary">View & Analyze Cases</CardTitle>
                    <p className="text-sm text-muted-foreground">Deep Dive with AI Chat</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <p className="text-foreground/70 mb-6">
                  Access your complete library of optometry cases. Review detailed information, get initial AI insights, and engage in interactive chat sessions with Focus AI for each case to deepen your understanding and learning.
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
