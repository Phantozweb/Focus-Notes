
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
  User, Briefcase, History, Eye, Microscope, BookOpen, Edit3, Save, FileText as FileTextIcon, CalendarIcon, ScanEye, ChevronLeft, ChevronRight, NotebookPen
} from 'lucide-react';
import type { FullOptometryCaseData } from '@/types/case';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';


const fullOptometryCaseSchema = z.object({
  // Patient Info
  patientId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
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


const TABS_CONFIG = [
  { value: "patientInfo", label: "Patient Info", icon: User, ref: React.createRef<HTMLDivElement>() },
  { value: "chiefComplaint", label: "Chief Complaint", icon: Briefcase, ref: React.createRef<HTMLDivElement>() },
  { value: "history", label: "History", icon: History, ref: React.createRef<HTMLDivElement>() },
  { value: "examination", label: "Examination", icon: Eye, ref: React.createRef<HTMLDivElement>() },
  { value: "slitLamp", label: "Slit Lamp", icon: Microscope, ref: React.createRef<HTMLDivElement>() },
  { value: "posteriorSegment", label: "Posterior Segment", icon: ScanEye, ref: React.createRef<HTMLDivElement>() },
  { value: "investigations", label: "Investigations", icon: BookOpen, ref: React.createRef<HTMLDivElement>() },
  { value: "assessmentPlan", label: "Assessment & Plan", icon: Edit3, ref: React.createRef<HTMLDivElement>() },
  { value: "notesReflection", label: "Notes & Reflection", icon: NotebookPen, ref: React.createRef<HTMLDivElement>() },
];


const TwoColumnField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="md:grid md:grid-cols-3 md:gap-3 items-start">
    <FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">{label}</FormLabel>
    <div className="md:col-span-2 mt-1 md:mt-0">{children}</div>
  </div>
);


export default function LogNewCasePage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const form = useForm<FullOptometryCaseFormValues>({
    resolver: zodResolver(fullOptometryCaseSchema),
    defaultValues: { 
      patientId: '', firstName: '', lastName: '', gender: '', contactNumber: '', email: '', address: '', chiefComplaint: '', presentIllnessHistory: '', pastOcularHistory: '', pastMedicalHistory: '', familyOcularHistory: '', familyMedicalHistory: '', medications: '', allergies: '', visualAcuityUncorrectedOD: '', visualAcuityUncorrectedOS: '', visualAcuityCorrectedOD: '', visualAcuityCorrectedOS: '', pupils: '', extraocularMotility: '', intraocularPressureOD: '', intraocularPressureOS: '', confrontationVisualFields: '', manifestRefractionOD: '', manifestRefractionOS: '', cycloplegicRefractionOD: '', cycloplegicRefractionOS: '', currentSpectacleRx: '', currentContactLensRx: '', lidsLashesOD: '', lidsLashesOS: '', conjunctivaScleraOD: '', conjunctivaScleraOS: '', corneaOD: '', corneaOS: '', anteriorChamberOD: '', anteriorChamberOS: '', irisOD: '', irisOS: '', lensOD: '', lensOS: '', vitreousOD: '', vitreousOS: '', opticDiscOD: '', opticDiscOS: '', cupDiscRatioOD: '', cupDiscRatioOS: '', maculaOD: '', maculaOS: '', vesselsOD: '', vesselsOS: '', peripheryOD: '', peripheryOS: '', octFindings: '', visualFieldFindings: '', fundusPhotographyFindings: '', otherInvestigations: '', assessment: '', plan: '', prognosis: '', followUp: '', internalNotes: '', reflection: '',
    },
  });

  // Refs for desktop tab scrolling
  const desktopTabsScrollAreaRef = useRef<HTMLDivElement>(null); 
  const desktopTabsViewportRef = useRef<HTMLDivElement | null>(null); 
  const desktopTabsListRef = useRef<HTMLDivElement>(null); 
  
  const [canScrollDesktopLeft, setCanScrollDesktopLeft] = useState(false);
  const [canScrollDesktopRight, setCanScrollDesktopRight] = useState(false);
  const DESKTOP_SCROLL_AMOUNT = 250;

  const isScrollingProgrammatically = React.useRef(false); // Moved to top level

  const scrollToSection = useCallback((sectionRef: React.RefObject<HTMLElement>) => {
    isScrollingProgrammatically.current = true;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Set a timeout to reset the flag after the scroll likely completes
    setTimeout(() => {
        isScrollingProgrammatically.current = false;
    }, 1000); // Adjust timeout as needed
  }, []);

  const handleTabChange = useCallback((index: number, isMobileNav: boolean) => {
    setCurrentTabIndex(index);
    scrollToSection(TABS_CONFIG[index].ref as React.RefObject<HTMLElement>);
    if (!isMobileNav && desktopTabsListRef.current) {
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
  }, [scrollToSection]);


  const checkDesktopScrollability = useCallback(() => {
    const viewport = desktopTabsViewportRef.current;
    const list = desktopTabsListRef.current;

    if (viewport && list) {
      const scrollLeft = viewport.scrollLeft;
      const scrollWidth = list.scrollWidth;
      const clientWidth = viewport.clientWidth;
      
      setCanScrollDesktopLeft(scrollLeft > 1); 
      setCanScrollDesktopRight(scrollWidth - clientWidth - scrollLeft > 1);
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
            // If viewport not found immediately, try again after a short delay
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

  // Update current tab based on scroll position
  useEffect(() => {
    const observerOptions = {
      root: null, // observing relative to the viewport
      rootMargin: '-40% 0px -60% 0px', // Triggers when section is roughly in the middle 20% of the viewport
      threshold: 0.01, // Even a small part of the section is visible
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingProgrammatically.current) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const intersectingTabIndex = TABS_CONFIG.findIndex(tab => tab.ref.current === entry.target);
          if (intersectingTabIndex !== -1 && intersectingTabIndex !== currentTabIndex) {
             setCurrentTabIndex(intersectingTabIndex);
          }
        }
      });
    };
    
    const observers: IntersectionObserver[] = [];
    TABS_CONFIG.forEach(tab => {
      if (tab.ref.current) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(tab.ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [currentTabIndex]); // Removed handleTabChange from dependencies as it's stable due to useCallback and relies on currentTabIndex

  function onSubmit(data: FullOptometryCaseFormValues) {
    console.log(data); 
    toast({
      title: 'Case Submitted (Simulated)',
      description: 'Case data logged to console. Implement actual save logic.',
    });
  }

  const renderFormField = (name: keyof FullOptometryCaseFormValues, label: string, placeholder?: string, isTextarea: boolean = false, rows?: number) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <TwoColumnField label={label}>
            <FormControl>
              {isTextarea ? (
                <Textarea placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} rows={rows || 3} className="resize-y" />
              ) : (
                <Input placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} />
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
                  <Textarea placeholder={placeholderOD || `OD...`} {...field} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOD || `OD...`} {...field} />
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
                  <Textarea placeholder={placeholderOS || `OS...`} {...field} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOS || `OS...`} {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );


  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <CardHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b pb-2">
            <CardTitle className="text-3xl font-bold text-primary flex items-center mb-2">
              <FileTextIcon className="mr-3 h-8 w-8" /> Log New Optometry Case
            </CardTitle>
            
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
                        <div className="text-center">
                            <span className="text-sm font-medium text-primary">{TABS_CONFIG[currentTabIndex].label}</span>
                            <span className="text-xs text-muted-foreground"> ({currentTabIndex + 1}/{TABS_CONFIG.length})</span>
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
                        value={TABS_CONFIG[currentTabIndex].value} 
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
          <CardContent className="pt-6"> 
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0"> 
                
                <div ref={TABS_CONFIG[0].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                  <SectionTitle title={TABS_CONFIG[0].label} icon={TABS_CONFIG[0].icon} />
                  {renderFormField('patientId', 'Patient ID (Optional)', 'e.g., P00123')}
                  {renderFormField('firstName', 'First Name', 'e.g., John')}
                  {renderFormField('lastName', 'Last Name', 'e.g., Doe')}
                    <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <TwoColumnField label="Date of Birth">
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </TwoColumnField>
                        </FormItem>
                    )}
                    />
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
                </div>

                <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Clear Form
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    <Save className="mr-2 h-4 w-4" /> Save Case
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
