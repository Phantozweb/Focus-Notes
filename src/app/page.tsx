
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/main-layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Eye, BrainCircuit, ShieldCheck, Zap, FolderKanban, PlusCircle, ArrowRight, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const router = useRouter();

  const handleNewCase = () => {
    router.push('/cases/new');
  };

  const handleViewCases = () => {
    router.push('/cases');
  };

  const features = [
    {
      icon: <BrainCircuit className="h-10 w-10 text-primary" />,
      title: "Interactive AI Assistant",
      description: "Leverage the power of Focus AI to fill out forms interactively. Save time and reduce manual data entry by simply talking to your assistant.",
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
      title: "Secure & Private",
      description: "All your case data is stored locally on your device, ensuring complete privacy and control over sensitive patient information.",
    },
  ];

  const whyChooseUs = [
    {
      title: "Accelerate Your Learning",
      description: "Deepen your understanding by reviewing AI-generated insights and engaging in a conversational chat about each case. Perfect for students and lifelong learners.",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Boost Your Efficiency",
      description: "Our intuitive, AI-assisted case logging form significantly speeds up the documentation process, freeing up more of your valuable time.",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Data You Can Trust",
      description: "With all data stored locally, you never have to worry about third-party data breaches or unauthorized access. Your work remains yours.",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    },
  ];

  const individualPricingTiers = [
    {
      name: "Monthly",
      price: "₹2400",
      price_sub: "/ month",
      save: null,
      cta: "Start Monthly",
      variant: 'outline',
    },
    {
      name: "3 Months",
      price: "₹6480",
      price_sub: "billed quarterly",
      save: "Save 10%",
      cta: "Choose 3 Months",
      variant: 'outline',
    },
    {
      name: "6 Months",
      price: "₹12240",
      price_sub: "billed semi-annually",
      save: "Save 15%",
      cta: "Choose 6 Months",
      variant: 'outline',
    },
    {
      name: "Yearly",
      price: "₹21600",
      price_sub: "billed annually",
      save: "Save 25%",
      cta: "Get Best Value",
      variant: 'default',
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


  const faqs = [
    {
      question: "Is my patient data secure?",
      answer: "Absolutely. Focus CaseX is designed with a 'privacy-first' approach. All case data you enter is stored exclusively in your browser's local storage. It never leaves your device, ensuring you have complete control and confidentiality."
    },
    {
      question: "How does the AI assistant work?",
      answer: "Our AI assistant uses advanced language models to understand your conversational input. When you're on the 'Log New Case' form, you can talk to the assistant, and it will intelligently extract information and populate the relevant fields for you, confirming its actions as it goes."
    },
    {
      question: "Can I use this on multiple devices?",
      answer: "Because all data is stored locally on a single device's browser, your cases will not automatically sync between different computers or devices. This is part of our commitment to ensuring your data's privacy. You can, however, use our CSV export feature to move data manually."
    },
     {
      question: "Who is this platform for?",
      answer: "Focus CaseX is ideal for optometry students who want an interactive learning tool, practicing optometrists who need an efficient way to log and review interesting cases for personal development, and educational institutions looking for a modern teaching aid."
    }
  ];

  return (
    <MainLayout>
       <style jsx global>{`
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes subtle-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-subtle-float { animation: subtle-float 6s ease-in-out infinite; }
      `}</style>

      {/* Hero Section */}
      <section className="py-24 md:py-32 text-center bg-gradient-to-b from-background via-blue-50/50 to-background dark:from-blue-950/10 dark:via-blue-950/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-6 animate-fade-in-down">
            Focus CaseX
          </h1>
          <p className="text-xl md:text-2xl font-medium text-foreground/90 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            The AI-Powered Platform for Optometry Education & Case Analysis
          </p>
          <p className="text-md sm:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Streamline your case logging with our intelligent assistant, uncover deep insights with powerful analytics, and accelerate your clinical learning.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <Button size="lg" onClick={handleNewCase} className="shadow-lg hover:shadow-primary/30 transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" /> Start Logging
            </Button>
            <Button size="lg" variant="outline" onClick={handleViewCases}>
              View My Cases <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
             <Button size="lg" variant="secondary">
              <LogIn className="mr-2 h-5 w-5" /> Login
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-background rounded-xl shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-primary/20">
                <div className="flex justify-center items-center mb-4 h-16 w-16 rounded-full bg-primary/10 mx-auto">
                   {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="lg:order-last">
                  <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-950/20 rounded-2xl shadow-xl">
                     <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Elevate Your Clinical Workflow</h2>
                    <p className="text-lg text-muted-foreground mb-8">Focus CaseX is more than just a tool—it's your dedicated partner for professional growth, designed by listening to the needs of students and clinicians.</p>
                  </div>
                </div>
                <div className="lg:order-first">
                    <ul className="space-y-6">
                        {whyChooseUs.map(item => (
                            <li key={item.title} className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">{item.icon}</div>
                                <div>
                                    <h4 className="font-semibold text-xl text-foreground">{item.title}</h4>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-muted/40 dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Choose the plan that's right for you.</p>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold">Individual Plan</h3>
            <p className="text-muted-foreground">For students and practicing optometrists.</p>
          </div>
          <div className="max-w-2xl mx-auto mb-12 p-6 bg-background/50 rounded-xl border">
            <ul className="space-y-3 text-muted-foreground text-sm grid grid-cols-2 gap-x-6 gap-y-3">
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Unlimited cases</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Full AI Assistant access</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Advanced AI Analytics</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /><span>Secure local storage</span></li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            {individualPricingTiers.map((tier) => (
              <Card key={tier.name} className={cn("flex flex-col shadow-lg rounded-2xl", tier.popular ? 'border-2 border-primary shadow-primary/20' : 'border')}>
                {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Best Value</div>}
                 {tier.save && <Badge variant="secondary" className="absolute top-4 right-4 bg-accent/20 text-accent-foreground border-accent/30">{tier.save}</Badge>}
                <CardHeader className="text-center pt-8 flex-grow">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-4xl font-bold text-foreground pt-2">
                     {tier.price}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">{tier.price_sub}</p>
                </CardHeader>
                <CardFooter className="p-6">
                  <Button size="lg" variant={tier.variant as "default" | "outline"} className="w-full">{tier.cta}</Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
             <Card key={institutionTier.name} className="flex flex-col shadow-lg rounded-2xl border">
                <CardHeader className="text-center pt-8">
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
                <CardFooter className="p-6">
                  <Button size="lg" variant={institutionTier.variant as "default" | "outline"} className="w-full">{institutionTier.cta}</Button>
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
