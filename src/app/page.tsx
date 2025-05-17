
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { FilePlus2, ListChecks, PlusCircle, ExternalLink } from 'lucide-react'; // Info and BookOpenCheck removed
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { toast } = useToast();

  // Placeholder actions for buttons
  // handleLearnMore function removed as its section is deleted

  const handleNewCase = () => {
    // In a real app, this would navigate to a new case page or open a modal
    // For now, we use the existing `onLogNewCase` functionality if available or toast.
    // As `onLogNewCase` was removed from Header/MainLayout, we'll just toast.
    toast({
      title: "Log New Case",
      description: "The form to log a new optometry case will be available here.",
    });
  };

  const handleViewCases = () => {
    // In a real app, this would navigate to the case list page
    toast({
      title: "View All Cases",
      description: "The page displaying all optometry cases will be available here.",
    });
  };


  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-28 text-center bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 animate-fade-in-down">
            Focus CaseX
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Welcome to Focus CaseX<br />Your professional platform for optometry case management and learning.
          </p>
        </div>
      </section>

      {/* Focus.AI Integrated Tool Section - REMOVED */}

      {/* Action Cards Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col bg-card rounded-xl overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <FilePlus2 className="h-10 w-10 text-primary" />
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
                  <ListChecks className="h-10 w-10 text-primary" />
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
