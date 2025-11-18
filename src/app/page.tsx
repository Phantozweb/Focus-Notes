
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Eye, BrainCircuit, ShieldCheck, Zap, FolderKanban, PlusCircle, ArrowRight, LogIn, XCircle, Check, MessageSquare, Share2, PartyPopper, Mic, Link as LinkIcon, Rss, Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Autoplay from "embla-carousel-autoplay";
import { differenceInDays } from 'date-fns';

function WelcomeModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const startDate = new Date('2024-12-12');
  const [daysPassed, setDaysPassed] = React.useState(0);

  React.useEffect(() => {
    // This will only run on the client side
    setDaysPassed(differenceInDays(new Date(), startDate));
  }, [startDate]);

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-primary">
            <PartyPopper className="h-7 w-7" />
            Welcome to Focus CaseX!
          </DialogTitle>
          <DialogDescription>
            We're in the early stages and are thrilled to have you here. Your feedback is crucial as we grow.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div className="text-center bg-muted p-4 rounded-lg">
                <p className="font-semibold text-lg text-foreground">Project Started: December 12, 2024</p>
                <p className="font-bold text-4xl text-primary">{daysPassed >= 0 ? daysPassed : 0}</p>
                <p className="text-muted-foreground">Days of Innovation & Community Feedback</p>
            </div>
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Focus CaseX is part of a larger ecosystem:</h3>
            <div className="space-y-4">
                <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
                        <Mic className="h-8 w-8 text-primary" />
                        <div>
                            <h4 className="font-semibold">Focus Cast</h4>
                            <p className="text-sm text-muted-foreground">A free podcast platform for eyecare professionals and students.</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleLinkClick('https://FocusCast.netlify.app')}>Listen Now <Rss className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
                        <LinkIcon className="h-8 w-8 text-primary" />
                        <div>
                            <h4 className="font-semibold">Focus Links</h4>
                            <p className="text-sm text-muted-foreground">The global community for eye care. Create your professional profile.</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleLinkClick('https://www.focuslinks.in')}>Join Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
                        <BrainCircuit className="h-8 w-8 text-primary" />
                        <div>
                            <h4 className="font-semibold">Focus.Ai</h4>
                            <p className="text-sm text-muted-foreground">The optometry AI tool that powers Focus CaseX, developed with your feedback.</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleLinkClick('https://focusai.netlify.app')}>Learn More <Info className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                </Card>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue to App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HomePage() {
  const router = useRouter();
  const carouselPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);

  React.useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenWelcomeModal');
    if (!hasSeenModal) {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcomeModal', 'true');
    }
  }, []);

  const features = [
    {
      icon: <BrainCircuit className="h-10 w-10 text-primary" />,
      title: "Interactive AI Assistant",
      description: "Leverage our powerful AI to fill out forms interactively. Save time and reduce manual data entry by simply talking to your assistant.",
    },
    {
      icon: <FolderKanban className="h-10 w-10 text-primary" />,
      title: "Comprehensive Case Management",
      description: "Log, view, and manage all your optometry cases in one secure, centralized platform. Search and filter with ease.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Instant Case Insights",
      description: "Generate instant, AI-powered summaries and key insights for any case, helping you to quickly grasp the most critical clinical details.",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: "Secure & Private by Design",
      description: "All your case data is stored locally on your device, ensuring complete privacy and control over sensitive patient information.",
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-primary" />,
      title: "Conversational AI Chat",
      description: "Dive deeper into any case by having a conversation with Focus AI. Ask questions, get clarifications, and enhance your understanding.",
    },
    {
      icon: <Share2 className="h-10 w-10 text-primary" />,
      title: "Export and Share",
      description: "Easily export your case data to CSV format for reporting, sharing with mentors, or for your personal academic portfolio.",
    }
  ];

  const comparisonData = [
    { feature: "AI Assistance", focusCaseX: true, traditional: false, generic: false },
    { feature: "Optometry-Specific Workflow", focusCaseX: true, traditional: true, generic: false },
    { feature: "Pricing", focusCaseX: "Affordable Subscription", traditional: "Very Expensive", generic: "Free/Cheap" },
    { feature: "Offline Access & Privacy", focusCaseX: true, traditional: false, generic: true },
    { feature: "Ease of Use", focusCaseX: "Very High", traditional: "Complex", generic: "Simple but limited" },
    { feature: "Mobile Accessibility", focusCaseX: true, traditional: false, generic: true },
    { feature: "Learning & Insights", focusCaseX: true, traditional: false, generic: false },
  ];

  const faqs = [
    {
      question: "Is my patient data secure and HIPAA compliant?",
      answer: "Absolutely. Focus CaseX is an offline-first platform designed with a 'privacy-first' architecture. All case data you enter is stored exclusively in your browser's local storage on your device. It never leaves your computer or gets transmitted to the cloud, ensuring you have 100% control and confidentiality. This local-only storage model inherently aligns with HIPAA principles by minimizing data exposure risks."
    },
    {
      question: "How does the AI assistant improve my workflow as an optometry student?",
      answer: "Our AI assistant revolutionizes case logging. Instead of manually typing everything, you can use conversational language. For example, say 'The patient is a 45-year-old male with a chief complaint of blurry vision at distance' and the AI will populate the 'Age', 'Sex', and 'Chief Complaint' fields for you. This AI-powered data entry not only saves significant time but also helps reinforce your clinical vocabulary and reporting structure."
    },
    {
      question: "Can I use this on multiple devices, like my laptop and clinic computer?",
      answer: "Since all data is stored locally within a single device's browser for maximum privacy, your cases will not automatically sync between different devices. This is a deliberate design choice to guarantee data security. However, you can use our built-in CSV export feature to easily transfer your case logs from one device to another, giving you both security and flexibility."
    },
     {
      question: "Who is this optometry software for?",
      answer: "Focus CaseX is the ideal clinical companion for optometry students seeking an interactive tool to accelerate their learning and for practicing optometrists who need an efficient method to log, review, and analyze interesting cases for continuing education and personal development. It also serves as a modern, effective teaching aid for optometry schools and colleges."
    },
    {
      question: "What happens to my data if my subscription expires?",
      answer: "Your data remains yours, always. Because all case information is stored locally on your device's browser storage, you will retain full access to it even if your subscription expires. You would only lose access to the AI-powered analysis and interactive assistant features, which require an active subscription to function. You can export all your data to CSV at any time, ensuring you always have a permanent record."
    },
    {
      question: "What AI model is used for the analysis and assistant features?",
      answer: "Focus CaseX is powered by Focus AI, which leverages state-of-the-art large language models (LLMs). These models have been carefully prompted and integrated into our system to understand the specific context of optometry. This allows our platform to provide fast, clinically relevant insights, generate concise case summaries, and power the interactive form-filling assistant, helping you learn and document more effectively."
    },
    {
      question: "Do you offer customer support if I run into any issues?",
      answer: "Yes, all our paid subscription plans include access to our priority email support. Our dedicated team is available to help you with any questions about features, troubleshoot technical issues, or listen to your suggestions for improving the platform. We are committed to ensuring you have a smooth and productive experience with Focus CaseX."
    }
  ];

  return (
    <MainLayout>
       <WelcomeModal open={showWelcomeModal} onOpenChange={setShowWelcomeModal} />
       <style jsx global>{`
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to- { opacity: 1; transform: translateY(0); } }
        @keyframes subtle-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-subtle-float { animation: subtle-float 6s ease-in-out infinite; }
      `}</style>

      {/* Hero Section */}
      <section className="py-24 md:py-32 text-center bg-gradient-to-br from-blue-50 via-background to-blue-100/50 dark:from-blue-950/20 dark:via-card dark:to-blue-950/10 animate-gradient-animation bg-[length:400%_400%]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down font-logo">
            <span className="text-primary">Focus Case</span><span className="text-foreground relative">X<span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-primary animate-blue-blink"></span></span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Your Intelligent Optometry EMR for Clinic & Classroom
          </p>
          <p className="text-md sm:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Effortlessly log cases with our AI assistant, manage patient records with ease, and accelerate your clinical workflow.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Button size="lg" onClick={() => router.push('/dashboard')} className="shadow-lg hover:shadow-primary/30 transition-shadow">
               <PlusCircle /> Get Started for Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('#features')} className="shadow-lg hover:shadow-lg transition-shadow bg-background/50">
               <ArrowRight /> Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-muted/40 dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Powerful Features, Simplified</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">Everything you need to master case logging and analysis, powered by AI.</p>
          </div>
          <Carousel
            plugins={[carouselPlugin.current]}
            className="w-full max-w-4xl mx-auto"
            onMouseEnter={carouselPlugin.current.stop}
            onMouseLeave={carouselPlugin.current.reset}
            opts={{
              loop: true,
            }}
          >
            <CarouselContent className="-ml-4">
              {features.map((feature, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <div className="h-full p-8 bg-background rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-primary/20 flex flex-col text-center">
                      <div className="flex-shrink-0 flex justify-center items-center h-20 w-20 rounded-full bg-primary/10 mx-auto mb-4">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex z-10" />
            <CarouselNext className="hidden md:flex z-10" />
          </Carousel>
           <p className="text-center text-muted-foreground text-sm mt-6 md:hidden">Swipe for more features</p>
        </div>
      </section>

       {/* Why Choose Us & Comparison Section */}
      <section id="why-choose-us" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">The Smart Choice for Modern Optometry</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">See how Focus CaseX stacks up against traditional tools.</p>
            </div>
            <Card className="shadow-2xl rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[200px] text-base font-semibold text-foreground">Feature</TableHead>
                            <TableHead className="text-center text-base font-semibold text-primary">Focus CaseX</TableHead>
                            <TableHead className="text-center text-base font-semibold text-foreground">Traditional Software</TableHead>
                            <TableHead className="text-center text-base font-semibold text-foreground">Generic Note Apps</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {comparisonData.map((item) => (
                        <TableRow key={item.feature}>
                            <TableCell className="font-medium text-foreground">{item.feature}</TableCell>
                            <TableCell className="text-center">
                                {typeof item.focusCaseX === 'boolean' ? (
                                    item.focusCaseX ? <CheckCircle className="h-6 w-6 text-green-500 mx-auto" /> : <XCircle className="h-6 w-6 text-destructive mx-auto" />
                                ) : <span className="font-semibold text-primary">{item.focusCaseX}</span>}
                            </TableCell>
                            <TableCell className="text-center">
                                {typeof item.traditional === 'boolean' ? (
                                    item.traditional ? <CheckCircle className="h-6 w-6 text-green-500 mx-auto" /> : <XCircle className="h-6 w-6 text-destructive mx-auto" />
                                ) : <span className="text-muted-foreground">{item.traditional}</span>}
                            </TableCell>
                            <TableCell className="text-center">
                                {typeof item.generic === 'boolean' ? (
                                    item.generic ? <CheckCircle className="h-6 w-6 text-green-500 mx-auto" /> : <XCircle className="h-6 w-6 text-destructive mx-auto" />
                                ) : <span className="text-muted-foreground">{item.generic}</span>}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-muted/40 dark:bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="text-base py-2 px-4 rounded-full mb-4 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700">
              <PartyPopper className="mr-2 h-5 w-5"/> Beta Testing Phase
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Free to Use, For Now!</h2>
            <p className="mt-4 text-lg text-muted-foreground">Focus CaseX is currently in an open beta. All features are completely free to use during this period. Jump in and start exploring!</p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 items-start">
            {/* Free Beta Plan */}
            <Card className="shadow-xl rounded-2xl border-2 border-primary">
              <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">Free Beta Access</CardTitle>
                  <CardDescription>For all students, educators, and practitioners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">All features included:</h4>
                  <ul className="space-y-3 text-muted-foreground text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Unlimited cases</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Full AI Assistant access</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Advanced AI Analytics</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Secure local storage</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>CSV Data Export</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Priority Support</span></li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                 <Button size="lg" className="w-full" onClick={() => router.push('/dashboard')}>
                    Go to App & Get Started
                 </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </MainLayout>
  );
}
