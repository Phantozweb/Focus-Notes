

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Eye, BrainCircuit, ShieldCheck, Zap, FolderKanban, PlusCircle, ArrowRight, LogIn, XCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Autoplay from "embla-carousel-autoplay";

export default function HomePage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = React.useState('Yearly');
  const carouselPlugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

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
      description: "All your case data is stored locally on your device, ensuring complete privacy and control over sensitive patient information. No cloud, no worries.",
    },
  ];

  const individualPricingTiers = [
    {
      name: "Monthly",
      price: "₹300",
      price_sub: "/ month",
      save: null,
    },
    {
      name: "3 Months",
      price: "₹750",
      price_sub: "billed quarterly",
      save: "Save 16%",
    },
    {
      name: "6 Months",
      price: "₹1200",
      price_sub: "billed semi-annually",
      save: "Save 33%",
    },
    {
      name: "Yearly",
      price: "₹2400",
      price_sub: "billed annually",
      save: "Save 33%",
      popular: true,
    }
  ];

  const institutionTier = {
    name: "Institution",
    price: "Contact Us",
    features: ["Includes all Individual Plan features", "Ideal for universities & colleges", "Special pricing for bulk licenses", "Simplified billing for your organization"],
    cta: "Contact Sales",
    variant: 'outline'
  };

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
       <style jsx global>{`
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to- { opacity: 1; transform: translateY(0); } }
        @keyframes subtle-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-subtle-float { animation: subtle-float 6s ease-in-out infinite; }
      `}</style>

      {/* Hero Section */}
      <section className="py-24 md:py-32 text-center bg-gradient-to-b from-background via-blue-50/50 to-background dark:from-blue-950/10 dark:via-blue-950/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 animate-fade-in-down font-logo">
            <span className="text-primary">Focus Case</span><span className="text-foreground relative">X<span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-primary animate-blue-blink"></span></span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            The AI-Powered Platform for Optometry Education & Case Analysis
          </p>
          <p className="text-md sm:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Streamline your case logging with our intelligent assistant, uncover deep insights with powerful analytics, and accelerate your clinical learning.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Button size="lg" onClick={() => router.push('#pricing')} className="shadow-lg hover:shadow-primary/30 transition-shadow">
               Get Started
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
                <CarouselItem key={index} className="pl-4">
                  <div className="p-1 h-full">
                    <div className="h-full p-8 bg-background rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-primary/20 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                      <div className="flex-shrink-0 flex justify-center items-center h-20 w-20 rounded-full bg-primary/10">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Choose the plan that's right for you.</p>
          </div>
          
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Individual Plan */}
            <Card className="lg:col-span-3 shadow-xl rounded-2xl border-2 border-primary">
              <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">Individual Plan</CardTitle>
                  <CardDescription>For students and practicing optometrists.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">All individual plans include:</h4>
                  <ul className="space-y-3 text-muted-foreground text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Unlimited cases</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Full AI Assistant access</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Advanced AI Analytics</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Secure local storage</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>CSV Data Export</span></li>
                    <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Priority Support</span></li>
                  </ul>
                </div>

                <div className="space-y-3">
                   {individualPricingTiers.map((tier) => (
                    <button 
                      key={tier.name} 
                      onClick={() => setSelectedPlan(tier.name)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all hover:border-primary",
                        selectedPlan === tier.name ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border'
                      )}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", selectedPlan === tier.name ? 'border-primary' : 'border-muted-foreground')}>
                             {selectedPlan === tier.name && <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{tier.name}</p>
                            <p className="text-xs text-muted-foreground">{tier.price_sub}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">{tier.price}</p>
                          {tier.save && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700 font-bold">{tier.save}</Badge>}
                          {tier.popular && <Badge className="mt-1" variant="default">Best Value</Badge>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                 <Button size="lg" className="w-full" onClick={() => router.push(`/checkout?plan=${selectedPlan}`)}>Get Started</Button>
              </CardFooter>
            </Card>

            {/* Institution Plan */}
            <Card className="lg:col-span-2 shadow-lg rounded-2xl border h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{institutionTier.name}</CardTitle>
                <CardDescription className="text-4xl font-bold text-foreground">
                   {institutionTier.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-4 text-muted-foreground">
                  {institutionTier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 mt-auto">
                <Button size="lg" variant={institutionTier.variant as "default" | "outline"} className="w-full" onClick={() => router.push('/contact')}>{institutionTier.cta}</Button>
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
