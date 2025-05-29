
'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  User, Briefcase, History, Eye, Microscope, BookOpen, Edit3, Save, FileTextIcon, ScanEye, ChevronLeft, ChevronRight, NotebookPen, ArrowLeft, Sparkles, Loader2, Bot, Send, MessageSquarePlus
} from 'lucide-react'; 
import type { FullOptometryCaseData, StoredOptometryCase, ChatMessage as AssistantChatMessage, GenkitChatMessage as AssistantGenkitChatMessage, InteractiveEmrAssistantInput } from '@/types/case';

import { cn } from '@/lib/utils';
import { useRef, useState, useEffect, useCallback }
from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
import { extractCaseInsights, type ExtractCaseInsightsInput } from '@/ai/flows/extract-case-insights';
import { interactiveEmrAssistant, type InteractiveEmrAssistantOutput } from '@/ai/flows/interactive-emr-assistant';
import useLocalStorage from '@/hooks/use-local-storage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import ReactMarkdown from 'react-markdown';


const fullOptometryCaseSchema = z.object({
  // Patient Info
  patientId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number()
    .int("Age must be a whole number.")
    .positive("Age must be a positive number.")
    .max(130, "Age seems too high.")
    .optional(),
  gender: z.string().optional(),
  contactNumber: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  address: z.string().optional(),

  // Chief Complaint
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  presentIllnessHistory: z.string().optional(),

  // History
  pastOcularHistory: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  familyOcularHistory: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),

  // Examination
  visualAcuityUncorrectedOD: z.string().optional(),
  visualAcuityUncorrectedOS: z.string().optional(),
  visualAcuityCorrectedOD: z.string().optional(),
  visualAcuityCorrectedOS: z.string().optional(),
  pupils: z.string().optional(),
  extraocularMotility: z.string().optional(),
  intraocularPressureOD: z.string().optional(),
  intraocularPressureOS: z.string().optional(),
  confrontationVisualFields: z.string().optional(),
  
  // Refraction (can be part of Examination or its own section)
  manifestRefractionOD: z.string().optional(),
  manifestRefractionOS: z.string().optional(),
  cycloplegicRefractionOD: z.string().optional(),
  cycloplegicRefractionOS: z.string().optional(),
  currentSpectacleRx: z.string().optional(),
  currentContactLensRx: z.string().optional(),

  // Slit Lamp
  lidsLashesOD: z.string().optional(),
  lidsLashesOS: z.string().optional(),
  conjunctivaScleraOD: z.string().optional(),
  conjunctivaScleraOS: z.string().optional(),
  corneaOD: z.string().optional(),
  corneaOS: z.string().optional(),
  anteriorChamberOD: z.string().optional(),
  anteriorChamberOS: z.string().optional(),
  irisOD: z.string().optional(),
  irisOS: z.string().optional(),
  lensOD: z.string().optional(),
  lensOS: z.string().optional(),

  // Posterior Segment
  vitreousOD: z.string().optional(),
  vitreousOS: z.string().optional(),
  opticDiscOD: z.string().optional(),
  opticDiscOS: z.string().optional(),
  cupDiscRatioOD: z.string().optional(),
  cupDiscRatioOS: z.string().optional(),
  maculaOD: z.string().optional(),
  maculaOS: z.string().optional(),
  vesselsOD: z.string().optional(),
  vesselsOS: z.string().optional(),
  peripheryOD: z.string().optional(),
  peripheryOS: z.string().optional(),

  // Investigations
  octFindings: z.string().optional(),
  visualFieldFindings: z.string().optional(),
  fundusPhotographyFindings: z.string().optional(),
  otherInvestigations: z.string().optional(),

  // Assessment & Plan
  assessment: z.string().min(1, "Assessment is required"),
  plan: z.string().min(1, "Plan is required"),
  prognosis: z.string().optional(),
  followUp: z.string().optional(),

  // Notes & Reflection
  internalNotes: z.string().optional(),
  reflection: z.string().optional(),
});

type FullOptometryCaseFormValues = z.infer<typeof fullOptometryCaseSchema>;

const SectionTitle = React.forwardRef<HTMLHeadingElement, { title: string; icon: React.ElementType }>(
  ({ title, icon: Icon }, ref) => (
    <h3 ref={ref} className="text-xl font-semibold text-primary mb-6 mt-8 flex items-center scroll-mt-24">
      <Icon className="mr-2 h-6 w-6" />
      {title}
    </h3>
  )
);
SectionTitle.displayName = "SectionTitle";


const TABS_CONFIG_BASE = [
  { value: "patientInfo", label: "Patient Info", icon: User },
  { value: "chiefComplaint", label: "Chief Complaint", icon: Briefcase },
  { value: "history", label: "History", icon: History },
  { value: "examination", label: "Examination", icon: Eye },
  { value: "slitLamp", label: "Slit Lamp", icon: Microscope },
  { value: "posteriorSegment", label: "Posterior Segment", icon: ScanEye },
  { value: "investigations", label: "Investigations", icon: BookOpen },
  { value: "assessmentPlan", label: "Assessment & Plan", icon: Edit3 },
  { value: "notesReflection", label: "Notes & Reflection", icon: NotebookPen },
];


const TwoColumnField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="md:grid md:grid-cols-3 md:gap-3 items-start">
    <FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">{label}</FormLabel>
    <div className="md:col-span-2 mt-1 md:mt-0">{children}</div>
  </div>
);

const defaultFormValues: Omit<FullOptometryCaseFormValues, 'age'> & { age?: number | string; name: string } = { 
  patientId: '', name: '', age: '', gender: '', contactNumber: '', email: '', address: '', chiefComplaint: '', presentIllnessHistory: '', pastOcularHistory: '', pastMedicalHistory: '', familyOcularHistory: '', familyMedicalHistory: '', medications: '', allergies: '', visualAcuityUncorrectedOD: '', visualAcuityUncorrectedOS: '', visualAcuityCorrectedOD: '', visualAcuityCorrectedOS: '', pupils: '', extraocularMotility: '', intraocularPressureOD: '', intraocularPressureOS: '', confrontationVisualFields: '', manifestRefractionOD: '', manifestRefractionOS: '', cycloplegicRefractionOD: '', cycloplegicRefractionOS: '', currentSpectacleRx: '', currentContactLensRx: '', lidsLashesOD: '', lidsLashesOS: '', conjunctivaScleraOD: '', conjunctivaScleraOS: '', corneaOD: '', corneaOS: '', anteriorChamberOD: '', anteriorChamberOS: '', irisOD: '', irisOS: '', lensOD: '', lensOS: '', vitreousOD: '', vitreousOS: '', opticDiscOD: '', opticDiscOS: '', cupDiscRatioOD: '', cupDiscRatioOS: '', maculaOD: '', maculaOS: '', vesselsOD: '', vesselsOS: '', peripheryOD: '', peripheryOS: '', octFindings: '', visualFieldFindings: '', fundusPhotographyFindings: '', otherInvestigations: '', assessment: '', plan: '', prognosis: '', followUp: '', internalNotes: '', reflection: '',
};


export default function LogNewCasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const TABS_CONFIG = React.useMemo(() => TABS_CONFIG_BASE.map(tab => ({ ...tab, ref: React.createRef<HTMLDivElement>() })), []);


  const memoizedInitialStoredCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialStoredCases);

  // AI Assistant Sidebar State
  const [isAssistantSheetOpen, setIsAssistantSheetOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantChatMessage[]>([]);
  const [currentAssistantInput, setCurrentAssistantInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const assistantScrollAreaRef = React.useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = React.useRef(false);

  const form = useForm<FullOptometryCaseFormValues>({
    resolver: zodResolver(fullOptometryCaseSchema),
    defaultValues: defaultFormValues as FullOptometryCaseFormValues,
  });

  const desktopTabsScrollAreaRef = React.useRef<HTMLDivElement>(null); 
  const desktopTabsViewportRef = React.useRef<HTMLDivElement | null>(null); 
  const desktopTabsListRef = React.useRef<HTMLDivElement>(null); 
  
  const [canScrollDesktopLeft, setCanScrollDesktopLeft] = useState(false);
  const [canScrollDesktopRight, setCanScrollDesktopRight] = useState(false);
  const DESKTOP_SCROLL_AMOUNT = 250;


  const scrollToSection = useCallback((sectionRef: React.RefObject<HTMLElement>) => {
    isScrollingProgrammatically.current = true;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
        isScrollingProgrammatically.current = false;
    }, 1000); 
  }, []);

 const handleTabChange = useCallback((index: number, isMobileNav: boolean = false) => { 
    if (index < 0 || index >= TABS_CONFIG.length) return;
    setCurrentTabIndex(index);
    scrollToSection(TABS_CONFIG[index].ref as React.RefObject<HTMLElement>);
    if (!isMobileNav && !isMobile && desktopTabsListRef.current) {
      const tabElement = desktopTabsListRef.current.children[index] as HTMLElement;
      if (tabElement && desktopTabsViewportRef.current) {
        const viewport = desktopTabsViewportRef.current;
        const tabLeft = tabElement.offsetLeft;
        const tabRight = tabLeft + tabElement.offsetWidth;
        const scrollLeft = viewport.scrollLeft;
        const clientWidth = viewport.clientWidth;

        if (tabLeft < scrollLeft) {
          viewport.scrollTo({ left: tabLeft - 16, behavior: 'smooth' }); 
        } else if (tabRight > scrollLeft + clientWidth) {
          viewport.scrollTo({ left: tabRight - clientWidth + 16, behavior: 'smooth' });
        }
      }
    }
  }, [scrollToSection, isMobile, TABS_CONFIG]);


  const checkDesktopScrollability = useCallback(() => {
    const viewport = desktopTabsViewportRef.current;
    const list = desktopTabsListRef.current;

    if (viewport && list) {
      const scrollLeft = viewport.scrollLeft;
      const scrollWidth = list.scrollWidth;
      const clientWidth = viewport.clientWidth;
      
      setCanScrollDesktopLeft(scrollLeft > 0.5); 
      setCanScrollDesktopRight(scrollLeft + clientWidth < scrollWidth - 0.5);
    } else {
      setCanScrollDesktopLeft(false);
      setCanScrollDesktopRight(false);
    }
  }, []);

  useEffect(() => {
    if (!isMobile && desktopTabsScrollAreaRef.current) {
        const viewportElement = desktopTabsScrollAreaRef.current.querySelector<HTMLDivElement>(
            ':scope > div[data-radix-scroll-area-viewport]'
        );
        if (viewportElement) {
            desktopTabsViewportRef.current = viewportElement;
        }

        const viewportToListen = desktopTabsViewportRef.current;
        if (viewportToListen) {
            checkDesktopScrollability();
            viewportToListen.addEventListener('scroll', checkDesktopScrollability, { passive: true });
            window.addEventListener('resize', checkDesktopScrollability);
            const timer = setTimeout(checkDesktopScrollability, 150); 

            return () => {
                viewportToListen.removeEventListener('scroll', checkDesktopScrollability);
                window.removeEventListener('resize', checkDesktopScrollability);
                clearTimeout(timer);
            };
        } else {
            const retryTimer = setTimeout(checkDesktopScrollability, 300);
            return () => clearTimeout(retryTimer);
        }
    }
}, [isMobile, checkDesktopScrollability]);


  const handleDesktopTabScroll = (direction: 'left' | 'right') => {
    const viewport = desktopTabsViewportRef.current;
    if (viewport) {
      const currentScrollLeft = viewport.scrollLeft;
      const newScrollLeft =
        direction === 'left'
          ? currentScrollLeft - DESKTOP_SCROLL_AMOUNT
          : currentScrollLeft + DESKTOP_SCROLL_AMOUNT;

      viewport.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };
  
  useEffect(() => {
    const observerOptions = {
      root: null, 
      rootMargin: '0px 0px -70% 0px', 
      threshold: 0.1, 
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingProgrammatically.current) return;

      const entry = entries.find(e => e.isIntersecting);
      if (entry) {
        const intersectingTabIndex = TABS_CONFIG.findIndex(tab => tab.ref.current === entry.target);
        setCurrentTabIndex(prevCurrentTabIndex => {
          if (intersectingTabIndex !== -1 && intersectingTabIndex !== prevCurrentTabIndex) {
            return intersectingTabIndex;
          }
          return prevCurrentTabIndex;
        });
      }
    };

    const observers: IntersectionObserver[] = [];
    TABS_CONFIG.forEach(tabConfig => {
      if (tabConfig.ref.current) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(tabConfig.ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [TABS_CONFIG]);


  useEffect(() => {
    if (!isMobile && desktopTabsListRef.current && TABS_CONFIG[currentTabIndex]) {
      const tabElement = desktopTabsListRef.current.children[currentTabIndex] as HTMLElement;
      if (tabElement && desktopTabsViewportRef.current) {
        const viewport = desktopTabsViewportRef.current;
        const tabLeft = tabElement.offsetLeft;
        const tabRight = tabLeft + tabElement.offsetWidth;
        const scrollLeft = viewport.scrollLeft;
        const clientWidth = viewport.clientWidth;

        if (tabLeft < scrollLeft) { 
          viewport.scrollTo({ left: tabLeft - 16, behavior: 'smooth' }); 
        } else if (tabRight > scrollLeft + clientWidth) { 
          viewport.scrollTo({ left: tabRight - clientWidth + 16, behavior: 'smooth' }); 
        }
      }
    }
  }, [currentTabIndex, isMobile, TABS_CONFIG]);

  const handleAiInsightGeneration = async () => {
    setIsAiLoading(true);
    const values = form.getValues();
    const visualAcuity = `OD: ${values.visualAcuityCorrectedOD || values.visualAcuityUncorrectedOD || 'N/A'}, OS: ${values.visualAcuityCorrectedOS || values.visualAcuityUncorrectedOS || 'N/A'}`;
    const refraction = `OD: ${values.manifestRefractionOD || 'N/A'}, OS: ${values.manifestRefractionOS || 'N/A'}`;
    
    let ocularHealthStatus = values.assessment;
    if (!ocularHealthStatus || ocularHealthStatus.trim() === '') {
      const odHealth = [values.opticDiscOD, values.maculaOD, values.vesselsOD, values.peripheryOD].filter(Boolean).join(', ');
      const osHealth = [values.opticDiscOS, values.maculaOS, values.vesselsOS, values.peripheryOS].filter(Boolean).join(', ');
      ocularHealthStatus = `OD Health: ${odHealth || 'Not specified'}. OS Health: ${osHealth || 'Not specified'}.`;
    }
    
    const additionalNotes = `${values.chiefComplaint || ''}\n${values.presentIllnessHistory || ''}`.trim();

    if (!ocularHealthStatus || ocularHealthStatus.trim() === '' || !additionalNotes) {
        toast({
            title: "Missing Information",
            description: "Please fill in Chief Complaint, Present Illness History, and Assessment (or posterior segment details) before generating AI insights.",
            variant: "destructive",
        });
        setIsAiLoading(false);
        return;
    }
    
    const input: ExtractCaseInsightsInput = {
      visualAcuity,
      refraction,
      ocularHealthStatus,
      additionalNotes,
    };

    try {
      const result = await extractCaseInsights(input);
      form.setValue('internalNotes', result.summary);
      form.setValue('reflection', result.insights);
      toast({
        title: 'AI Insights Generated',
        description: 'Internal notes and reflection fields have been populated by AI.',
      });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast({
        title: 'AI Insight Generation Failed',
        description: 'Could not generate insights. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAiLoading(false);
    }
  };


  function onSubmit(data: FullOptometryCaseFormValues) {
    const newCase: StoredOptometryCase = {
      ...data,
      id: Date.now().toString(), 
      timestamp: Date.now(),
    };
    setStoredCases([...storedCases, newCase]);
    toast({
      title: 'Case Saved Successfully!',
      description: `Case for ${data.name} has been saved.`,
    });
    form.reset(defaultFormValues as FullOptometryCaseFormValues); 
    setAssistantMessages([]); 
  }

  const renderFormField = (name: keyof FullOptometryCaseFormValues, label: string, placeholder?: string, isTextarea: boolean = false, rows?: number, inputType?: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TwoColumnField label={label}>
            <FormControl>
              {isTextarea ? (
                <Textarea placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} value={field.value === undefined || field.value === null ? '' : String(field.value)} rows={rows || 3} className="resize-y" />
              ) : (
                <Input type={inputType || 'text'} placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} value={field.value === undefined || field.value === null ? '' : String(field.value)} />
              )}
            </FormControl>
            <FormMessage />
          </TwoColumnField>
        </FormItem>
      )}
    />
  );
  
  const renderDoubleFormField = (nameOD: keyof FullOptometryCaseFormValues, nameOS: keyof FullOptometryCaseFormValues, label: string, placeholderOD?: string, placeholderOS?: string, isTextarea: boolean = false, rows?: number) => (
    <div className="md:grid md:grid-cols-3 md:gap-3 items-start">
      <FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">{label}</FormLabel>
      <div className="md:col-span-2 mt-1 md:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={nameOD}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">OD (Right Eye)</FormLabel>
              <FormControl>
                {isTextarea ? (
                  <Textarea placeholder={placeholderOD || `OD...`} {...field} value={field.value || ''} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOD || `OD...`} {...field} value={field.value || ''} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={nameOS}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">OS (Left Eye)</FormLabel>
              <FormControl>
                {isTextarea ? (
                  <Textarea placeholder={placeholderOS || `OS...`} {...field} value={field.value || ''} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOS || `OS...`} {...field} value={field.value || ''} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // AI Assistant Logic
  useEffect(() => {
    if (assistantScrollAreaRef.current) {
      assistantScrollAreaRef.current.scrollTo({ top: assistantScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [assistantMessages]);

  const handleSendToAssistant = async () => {
    if (!currentAssistantInput.trim()) return;

    const newUserMessage: AssistantChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentAssistantInput.trim(),
    };
    setAssistantMessages(prev => [...prev, newUserMessage]);
    const currentInputForAI = currentAssistantInput;
    setCurrentAssistantInput('');
    setIsAssistantLoading(true);

    const sectionContext = TABS_CONFIG[currentTabIndex]?.label || "General";
    const formSnapshot = form.getValues();
    const historyForAI: AssistantGenkitChatMessage[] = assistantMessages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant') 
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    
    const aiInput: InteractiveEmrAssistantInput = {
      sectionContext,
      userMessage: currentInputForAI,
      formSnapshot,
      chatHistory: historyForAI,
    };

    try {
      const result: InteractiveEmrAssistantOutput = await interactiveEmrAssistant(aiInput);
      const aiResponse: AssistantChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.aiResponseMessage,
      };
      setAssistantMessages(prev => [...prev, aiResponse]);

      if (result.fieldsToUpdateJson) {
        try {
          const fieldsToUpdate = JSON.parse(result.fieldsToUpdateJson);
          if (fieldsToUpdate && typeof fieldsToUpdate === 'object' && Object.keys(fieldsToUpdate).length > 0) {
            const fieldUpdateMessages: string[] = [];
            for (const [key, value] of Object.entries(fieldsToUpdate)) {
              if (value !== undefined && value !== null && fullOptometryCaseSchema.shape.hasOwnProperty(key)) {
                // @ts-ignore
                form.setValue(key as keyof FullOptometryCaseFormValues, String(value), { shouldValidate: true, shouldDirty: true });
                fieldUpdateMessages.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
              }
            }
            if (fieldUpdateMessages.length > 0) {
                const systemUpdateMessage: AssistantChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: 'system',
                    content: `AI updated: ${fieldUpdateMessages.join(', ')}.`,
                };
                setAssistantMessages(prev => [...prev, systemUpdateMessage]);
                toast({ title: "AI Form Update", description: `AI updated the following fields: ${fieldUpdateMessages.join(', ')}.`});
            }
          }
        } catch (parseError) {
          console.error("AI Assistant: Error parsing fieldsToUpdateJson:", parseError, "Raw JSON:", result.fieldsToUpdateJson);
          toast({ title: "AI Form Update Warning", description: "AI suggested updates, but there was an issue applying them. Please check the assistant's message.", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred with the AI assistant.';
      const errorResponse: AssistantChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
      };
      setAssistantMessages(prev => [...prev, errorResponse]);
      toast({ title: 'AI Assistant Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  useEffect(() => {
    if (isAssistantSheetOpen && assistantMessages.length === 0) { 
        const firstQuestion: AssistantChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hello! I'm Focus AI, your EMR assistant. We are in the "${TABS_CONFIG[currentTabIndex].label}" section. What information can I help you log first? Or you can just start telling me details.`,
        };
        setAssistantMessages([firstQuestion]);
    } else if (isAssistantSheetOpen && assistantMessages.length > 0 && assistantMessages[assistantMessages.length -1].role !== 'user') {
        // Proactive question on tab change might be too intrusive.
        // This is where you could potentially trigger a new question if the tab changes and the assistant is open.
    }
  }, [currentTabIndex, isAssistantSheetOpen, TABS_CONFIG, assistantMessages.length]);


  return (
    <MainLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <Card className="shadow-xl max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <CardHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b pb-4 pt-4">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                    <ArrowLeft className="h-6 w-6 text-primary" />
                    <span className="sr-only">Back</span>
                </Button>
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center text-center flex-grow justify-center">
                  <FileTextIcon className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Log New Optometry Case
                </CardTitle>
                 <div className="w-10 h-10"> {/* Spacer to balance the back button for centering title */}</div>
            </div>

            <div className="mb-4 flex justify-center">
                <Button
                  variant="default"
                  className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group py-3 px-6 rounded-md"
                  onClick={() => setIsAssistantSheetOpen(true)}
                >
                  <span className="absolute inset-0 w-full h-full block animate-shine-pass">
                    <span className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span>
                  </span>
                  <Bot className="mr-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  Focus AI Assistant
                </Button>
            </div>
            
            <div className="h-14 flex items-center">
                {isMobile ? (
                    <div className="flex items-center justify-between w-full px-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTabChange(Math.max(0, currentTabIndex - 1), true)}
                            disabled={currentTabIndex === 0}
                            aria-label="Previous Section"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="text-center flex items-center justify-center">
                           {TABS_CONFIG[currentTabIndex]?.icon && React.createElement(TABS_CONFIG[currentTabIndex].icon, { className: "mr-2 h-5 w-5 text-primary" })}
                           <span className="text-sm font-medium text-primary">{TABS_CONFIG[currentTabIndex]?.label}</span>
                           <span className="text-xs text-muted-foreground ml-1"> ({TABS_CONFIG[currentTabIndex] ? currentTabIndex + 1 : 0}/{TABS_CONFIG.length})</span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleTabChange(Math.min(TABS_CONFIG.length - 1, currentTabIndex + 1), true)}
                            disabled={currentTabIndex === TABS_CONFIG.length - 1}
                            aria-label="Next Section"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                ) : (
                     <Tabs 
                        value={TABS_CONFIG[currentTabIndex]?.value} 
                        onValueChange={(newTabValue) => {
                            const newIndex = TABS_CONFIG.findIndex(tab => tab.value === newTabValue);
                            if (newIndex !== -1) {
                                handleTabChange(newIndex, false);
                            }
                        }}
                        className="w-full"
                     >
                        <div className="flex items-center space-x-1 w-full">
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => handleDesktopTabScroll('left')}
                            disabled={!canScrollDesktopLeft}
                            aria-label="Scroll tabs left"
                            >
                            <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <ScrollArea
                            orientation="horizontal"
                            className="flex-grow w-full pb-0 [&>[data-radix-scroll-area-scrollbar][data-orientation='horizontal']]:hidden"
                            ref={desktopTabsScrollAreaRef}
                            >
                                <TabsList ref={desktopTabsListRef} className="border-b-0 whitespace-nowrap justify-start relative pl-1 pr-6">
                                {TABS_CONFIG.map((tab, index) => (
                                    <TabsTrigger
                                    key={tab.value}
                                    value={tab.value} 
                                    onClick={() => handleTabChange(index, false)}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium rounded-md",
                                        currentTabIndex === index ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                    >
                                    <tab.icon className="mr-2 h-4 w-4" />{tab.label}
                                    </TabsTrigger>
                                ))}
                                </TabsList>
                            </ScrollArea>
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => handleDesktopTabScroll('right')}
                            disabled={!canScrollDesktopRight}
                            aria-label="Scroll tabs right"
                            >
                            <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                     </Tabs>
                )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 overflow-y-auto"> 
            <ScrollArea className="h-full pr-2"> 
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0"> 
                  
                  <div ref={TABS_CONFIG[0].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[0].label} icon={TABS_CONFIG[0].icon} />
                    {renderFormField('patientId', 'Patient ID (Optional)', 'e.g., P00123')}
                    {renderFormField('name', 'Name', 'e.g., John Doe')}
                    {renderFormField('age', 'Age', 'e.g., 25', false, undefined, 'number')}
                    {renderFormField('gender', 'Gender', 'e.g., Male, Female, Other')}
                    {renderFormField('contactNumber', 'Contact Number', 'e.g., (555) 123-4567')}
                    {renderFormField('email', 'Email Address', 'e.g., john.doe@example.com')}
                    {renderFormField('address', 'Address', 'e.g., 123 Main St, Anytown, USA', true, 3)}
                  </div>

                  <div ref={TABS_CONFIG[1].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[1].label} icon={TABS_CONFIG[1].icon} />
                    {renderFormField('chiefComplaint', 'Chief Complaint', 'e.g., Blurry vision at distance for 2 weeks', true, 4)}
                    {renderFormField('presentIllnessHistory', 'History of Present Illness', 'Details about the onset, duration, severity, etc.', true, 5)}
                  </div>

                  <div ref={TABS_CONFIG[2].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[2].label} icon={TABS_CONFIG[2].icon} />
                    {renderFormField('pastOcularHistory', 'Past Ocular History', 'e.g., Previous eye surgeries, conditions like glaucoma, AMD', true, 4)}
                    {renderFormField('pastMedicalHistory', 'Past Medical History', 'e.g., Diabetes, Hypertension, Thyroid issues', true, 4)}
                    {renderFormField('familyOcularHistory', 'Family Ocular History', 'e.g., Glaucoma in mother, Strabismus in sibling', true, 3)}
                    {renderFormField('familyMedicalHistory', 'Family Medical History', 'e.g., Diabetes in father', true, 3)}
                    {renderFormField('medications', 'Current Medications', 'List all medications and dosages', true, 4)}
                    {renderFormField('allergies', 'Allergies', 'e.g., Penicillin (rash), NKDA', true, 3)}
                  </div>
                  
                  <div ref={TABS_CONFIG[3].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                      <SectionTitle title={TABS_CONFIG[3].label} icon={TABS_CONFIG[3].icon} />
                      <h4 className="text-md font-medium text-muted-foreground mb-2">Visual Acuity (Uncorrected)</h4>
                      {renderDoubleFormField('visualAcuityUncorrectedOD', 'visualAcuityUncorrectedOS', 'UCVA', 'e.g., 20/40', 'e.g., 20/50')}
                      <h4 className="text-md font-medium text-muted-foreground mt-4 mb-2">Visual Acuity (Corrected/Best Corrected)</h4>
                      {renderDoubleFormField('visualAcuityCorrectedOD', 'visualAcuityCorrectedOS', 'BCVA/Pin Hole', 'e.g., 20/20', 'e.g., 20/25')}
                      
                      {renderFormField('pupils', 'Pupils', 'e.g., PERRLA, APD OS', true, 2)}
                      {renderFormField('extraocularMotility', 'Extraocular Motility (EOMs)', 'e.g., SAFE, Full, any restrictions noted', true, 2)}
                      
                      <h4 className="text-md font-medium text-muted-foreground mt-4 mb-2">Intraocular Pressure (IOP)</h4>
                      {renderDoubleFormField('intraocularPressureOD', 'intraocularPressureOS', 'IOP (mmHg)', 'e.g., 15 @ 10:30 AM (NCT)', 'e.g., 16 @ 10:30 AM (NCT)')}
                      
                      {renderFormField('confrontationVisualFields', 'Confrontation Visual Fields', 'e.g., Full to finger counting OU', true, 2)}

                      <h4 className="text-md font-medium text-muted-foreground mt-4 mb-2">Refraction</h4>
                          {renderDoubleFormField('manifestRefractionOD', 'manifestRefractionOS', 'Manifest Refraction (Sphere/Cyl/Axis/Add)', 'e.g., -2.00 -0.50 x 180 Add +2.00', 'e.g., -1.75 DS Add +2.00')}
                          {renderDoubleFormField('cycloplegicRefractionOD', 'cycloplegicRefractionOS', 'Cycloplegic Refraction (Optional)', 'e.g., -1.75 -0.50 x 175', 'e.g., -1.50 DS')}
                          {renderFormField('currentSpectacleRx', 'Current Spectacle Rx', 'Details of current glasses', true, 2)}
                          {renderFormField('currentContactLensRx', 'Current Contact Lens Rx', 'Details of current contact lenses', true, 2)}
                  </div>

                  <div ref={TABS_CONFIG[4].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[4].label} icon={TABS_CONFIG[4].icon} />
                    {renderDoubleFormField('lidsLashesOD', 'lidsLashesOS', 'Lids & Lashes', 'WNL', 'WNL', true, 2)}
                    {renderDoubleFormField('conjunctivaScleraOD', 'conjunctivaScleraOS', 'Conjunctiva & Sclera', 'Clear, quiet', 'Clear, quiet', true, 2)}
                    {renderDoubleFormField('corneaOD', 'corneaOS', 'Cornea', 'Clear, compact', 'Clear, compact', true, 2)}
                    {renderDoubleFormField('anteriorChamberOD', 'anteriorChamberOS', 'Anterior Chamber', 'Deep & quiet', 'Deep & quiet', true, 2)}
                    {renderDoubleFormField('irisOD', 'irisOS', 'Iris', 'Flat, intact', 'Flat, intact', true, 2)}
                    {renderDoubleFormField('lensOD', 'lensOS', 'Lens', 'Clear / Grade 1 NS', 'Clear / Grade 1 NS', true, 2)}
                  </div>

                  <div ref={TABS_CONFIG[5].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[5].label} icon={TABS_CONFIG[5].icon} />
                    {renderDoubleFormField('vitreousOD', 'vitreousOS', 'Vitreous', 'Clear, PVD', 'Clear', true, 2)}
                    {renderDoubleFormField('opticDiscOD', 'opticDiscOS', 'Optic Disc', 'Pink, sharp margins', 'Pink, sharp margins', true, 2)}
                    {renderDoubleFormField('cupDiscRatioOD', 'cupDiscRatioOS', 'Cup/Disc Ratio', '0.3', '0.35', false)}
                    {renderDoubleFormField('maculaOD', 'maculaOS', 'Macula', 'Flat, good foveal reflex', 'Flat, good foveal reflex', true, 2)}
                    {renderDoubleFormField('vesselsOD', 'vesselsOS', 'Vessels', 'Normal caliber and course', 'Normal caliber and course', true, 2)}
                    {renderDoubleFormField('peripheryOD', 'peripheryOS', 'Periphery (Dilated)', 'Flat, no breaks or lesions', 'Flat, no breaks or lesions', true, 3)}
                  </div>

                  <div ref={TABS_CONFIG[6].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[6].label} icon={TABS_CONFIG[6].icon} />
                    {renderFormField('octFindings', 'OCT Findings', 'e.g., Macular OCT: Normal retinal layers OU. RNFL OCT: Within normal limits OU.', true, 4)}
                    {renderFormField('visualFieldFindings', 'Visual Field Findings', 'e.g., Humphrey 24-2 SITA-Standard: Reliable, no significant defects OU.', true, 4)}
                    {renderFormField('fundusPhotographyFindings', 'Fundus Photography Findings', 'e.g., Documented optic disc and macular appearance as noted in exam.', true, 4)}
                    {renderFormField('otherInvestigations', 'Other Investigations', 'e.g., Corneal Topography, Pachymetry, A-scan etc.', true, 4)}
                  </div>

                  <div ref={TABS_CONFIG[7].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[7].label} icon={TABS_CONFIG[7].icon} />
                    {renderFormField('assessment', 'Assessment / Diagnoses', '1. Myopia OU\n2. Presbyopia OU\n3. Dry Eye Syndrome OU (Mild)', true, 5)}
                    {renderFormField('plan', 'Plan', '1. Rx Spectacles: ...\n2. Artificial Tears QID OU\n3. Patient education on ...\n4. RTC 1 year or PRN', true, 6)}
                    {renderFormField('prognosis', 'Prognosis', 'e.g., Good with current management.', true, 2)}
                    {renderFormField('followUp', 'Follow Up Instructions', 'e.g., Return in 1 year for comprehensive exam, or sooner if symptoms worsen.', true, 3)}
                  </div>
                  
                  <div ref={TABS_CONFIG[8].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                    <SectionTitle title={TABS_CONFIG[8].label} icon={TABS_CONFIG[8].icon} />
                    {renderFormField('internalNotes', 'Internal Notes (Not for Patient)', 'e.g., Consider differential XYZ if no improvement.', true, 4)}
                    {renderFormField('reflection', 'Personal Reflection/Learning Points', 'e.g., This case highlights the importance of cycloplegic refraction in young myopes.', true, 4)}
                    <div className="flex justify-start pt-2">
                      <Button type="button" onClick={handleAiInsightGeneration} disabled={isAiLoading} variant="outline">
                        {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isAiLoading ? 'Generating...' : 'Generate AI Draft for Notes & Reflection'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => {form.reset(defaultFormValues as FullOptometryCaseFormValues); setAssistantMessages([]);}}>
                      Clear Form
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      <Save className="mr-2 h-4 w-4" /> Save Case
                    </Button>
                  </div>
                </form>
              </Form>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isAssistantSheetOpen} onOpenChange={setIsAssistantSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary" />Focus AI Assistant</SheetTitle>
            <SheetDescription>
              Chat with AI to help fill the EMR for the current section: <span className="font-semibold text-primary">{TABS_CONFIG[currentTabIndex]?.label || "Details"}</span>.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow p-4 space-y-4" ref={assistantScrollAreaRef}>
            {assistantMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm",
                  message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 
                  message.role === 'assistant' ? 'mr-auto bg-muted text-muted-foreground' : 
                  'mx-auto bg-amber-100 text-amber-800 border border-amber-300 text-xs italic w-full' 
                )}
              >
                {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                 <div className="flex-grow break-words prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-0.5 last:mb-0" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                  </div>
                {message.role === 'user' && <User className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />}
              </div>
            ))}
             {assistantMessages.length === 0 && !isAssistantLoading && (
              <div className="text-center text-muted-foreground py-6">
                <Bot className="h-10 w-10 mx-auto mb-2 text-primary/50" /> {/* Changed icon to Bot */}
                <p>Ask Focus AI to help fill this section, or provide details.</p>
                <p className="text-xs mt-1">e.g., "Patient name is Jane Doe, age 42."</p>
              </div>
            )}
            {isAssistantLoading && assistantMessages[assistantMessages.length -1]?.role === 'user' && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm mr-auto bg-muted text-muted-foreground">
                    <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
                    <p className="italic">Focus AI is thinking...</p>
                </div>
            )}
          </ScrollArea>
          <SheetFooter className="p-4 border-t bg-muted/50">
            <div className="flex items-center gap-2 w-full">
              <Input
                type="text"
                placeholder="Type your EMR details or ask AI..."
                value={currentAssistantInput}
                onChange={(e) => setCurrentAssistantInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAssistantLoading && handleSendToAssistant()}
                className="flex-grow bg-background focus:ring-primary"
                disabled={isAssistantLoading}
              />
              <Button onClick={handleSendToAssistant} disabled={isAssistantLoading || !currentAssistantInput.trim()} size="icon">
                {isAssistantLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send to AI Assistant</span>
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
    

    

    

    
