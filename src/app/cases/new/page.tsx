
'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import { useForm } from 'react-hook-form';
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
  User, Briefcase, History, Eye, Microscope, Edit3, Save, FileTextIcon, ScanEye, ChevronLeft, ChevronRight, NotebookPen, ArrowLeft, Bot, Send, X, Loader2, Baby, HelpCircle, ChevronDown, Activity, Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { FullOptometryCaseData, StoredOptometryCase, ChatMessage as AssistantChatMessage, GenkitChatMessage as AssistantGenkitChatMessage, InteractiveEmrAssistantInput } from '@/types/case';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';
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
import { format } from 'date-fns';

// Zod schema based on the new detailed specification
const fullOptometryCaseSchema = z.object({
  // Patient & Visit Info
  posting: z.string().optional(),
  mrdNo: z.string().optional(),
  dateOfVisit: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().positive().optional(),
  sex: z.enum(['Male', 'Female', 'Other']).optional(),

  // History
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  pastOcularHistory: z.string().optional(),
  currentMedications: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  recentInvestigations: z.string().optional(),
  familyHistory: z.string().optional(),
  birthHistory: z.string().optional(),
  allergies: z.string().optional(),

  // Visual Acuity
  distanceUnaidedOD: z.string().optional(),
  distanceUnaidedOS: z.string().optional(),
  distancePinholeOD: z.string().optional(),
  distancePinholeOS: z.string().optional(),
  distanceOldGlassesOD: z.string().optional(),
  distanceOldGlassesOS: z.string().optional(),
  nearUnaidedOD: z.string().optional(),
  nearUnaidedOS: z.string().optional(),
  nearPinholeOD: z.string().optional(),
  nearPinholeOS: z.string().optional(),
  nearOldGlassesOD: z.string().optional(),
  nearOldGlassesOS: z.string().optional(),
  
  // Refraction - Previous
  pgpSphOD: z.string().optional(),
  pgpCylOD: z.string().optional(),
  pgpAxisOD: z.string().optional(),
  pgpSphOS: z.string().optional(),
  pgpCylOS: z.string().optional(),
  pgpAxisOS: z.string().optional(),

  // Auto Refractor
  autoRefractionOD: z.string().optional(),
  autoRefractionOS: z.string().optional(),
  
  // Refraction - Objective
  objRefractionOD: z.string().optional(),
  objRefractionOS: z.string().optional(),
  objRefractionFindingsOD: z.array(z.string()).optional(),
  objRefractionFindingsOS: z.array(z.string()).optional(),
  
  // Refraction - Subjective
  subjRefractionOD: z.string().optional(),
  subjRefractionOS: z.string().optional(),
  subjRefractionChecksOD: z.array(z.string()).optional(),
  subjRefractionChecksOS: z.array(z.string()).optional(),
  
  // Final Correction
  finalAcuityOD: z.string().optional(),
  finalAcuityOS: z.string().optional(),
  finalCorrectionPreference: z.enum(['Prefers new glasses', 'Continue same PGP']).optional(),
  lensType: z.string().optional(),
  prismDioptersOD: z.string().optional(),
  prismBaseOD: z.string().optional(),
  prismDioptersOS: z.string().optional(),
  prismBaseOS: z.string().optional(),


  // Ancillary Ocular Tests
  keratometryVerticalOD: z.string().optional(),
  keratometryHorizontalOD: z.string().optional(),
  keratometryVerticalOS: z.string().optional(),
  keratometryHorizontalOS: z.string().optional(),
  keratometryComments: z.string().optional(),
  coverTest: z.string().optional(),
  eom: z.string().optional(),
  npcSubj: z.string().optional(),
  npcObj: z.string().optional(),
  npaOD: z.string().optional(),
  npaOS: z.string().optional(),
  npaOU: z.string().optional(),
  wfdtDistance: z.string().optional(),
  wfdtNear: z.string().optional(),
  stereopsis: z.string().optional(),

  // Slit Lamp & Anterior Segment
  pupillaryEvaluation: z.string().optional(),
  externalExamination: z.string().optional(),
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
  
  // Tonometry & Dry Eye
  tonometryPressureOD: z.string().optional(),
  tonometryPressureOS: z.string().optional(),
  tonometryMethod: z.enum(['GAT', 'NCT', 'Perkins']).optional(),
  tonometryTime: z.string().optional(),
  tbutOD: z.string().optional(),
  tbutOS: z.string().optional(),
  schirmerOD: z.string().optional(),
  schirmerOS: z.string().optional(),

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
  
  // Final Plan
  diagnosis: z.string().min(1, "Diagnosis is required"),
  interventionPlanned: z.string().min(1, "Intervention Plan is required"),
  learning: z.string().min(1, "Learning/Reflection is required"),
});

type FullOptometryCaseFormValues = z.infer<typeof fullOptometryCaseSchema>;

const defaultFormValues: FullOptometryCaseFormValues = {
  posting: 'General OPD', mrdNo: '', dateOfVisit: Date.now(), name: '',
  chiefComplaint: '', pastOcularHistory: '', currentMedications: '', pastMedicalHistory: '',
  recentInvestigations: '', familyHistory: '', allergies: '', birthHistory: '', 
  distanceUnaidedOD: '', distanceUnaidedOS: '', distancePinholeOD: '', distancePinholeOS: '',
  distanceOldGlassesOD: '', distanceOldGlassesOS: '', nearUnaidedOD: '', nearUnaidedOS: '',
  nearPinholeOD: '', nearPinholeOS: '', nearOldGlassesOD: '', nearOldGlassesOS: '',
  pgpSphOD: '', pgpCylOD: '', pgpAxisOD: '', pgpSphOS: '', pgpCylOS: '', pgpAxisOS: '',
  autoRefractionOD: '', autoRefractionOS: '',
  objRefractionOD: '', objRefractionOS: '', objRefractionFindingsOD: [], objRefractionFindingsOS: [],
  subjRefractionOD: '', subjRefractionOS: '', subjRefractionChecksOD: [], subjRefractionChecksOS: [],
  finalAcuityOD: '', finalAcuityOS: '',
  lensType: '', prismDioptersOD: '', prismBaseOD: '', prismDioptersOS: '', prismBaseOS: '',
  keratometryVerticalOD: '', keratometryHorizontalOD: '', keratometryVerticalOS: '', keratometryHorizontalOS: '',
  keratometryComments: '', coverTest: '', eom: '', npcSubj: '', npcObj: '', npaOD: '', npaOS: '',
  npaOU: '', wfdtDistance: '', wfdtNear: '', stereopsis: '', pupillaryEvaluation: '',
  externalExamination: '', lidsLashesOD: '', lidsLashesOS: '', conjunctivaScleraOD: '',
  conjunctivaScleraOS: '', corneaOD: '', corneaOS: '', anteriorChamberOD: '', anteriorChamberOS: '',
  irisOD: '', irisOS: '', lensOD: '', lensOS: '', tonometryPressureOD: '', tonometryPressureOS: '',
  tonometryTime: '', tbutOD: '', tbutOS: '', schirmerOD: '', schirmerOS: '', vitreousOD: '',
  vitreousOS: '', opticDiscOD: '', opticDiscOS: '', cupDiscRatioOD: '', cupDiscRatioOS: '',
  maculaOD: '', maculaOS: '', vesselsOD: '', vesselsOS: '', peripheryOD: '', peripheryOS: '',
  diagnosis: '', interventionPlanned: '', learning: '',
};

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
  { value: "history", label: "History", icon: History },
  { value: "vaRefraction", label: "VA & Refraction", icon: Eye },
  { value: "ancillaryTests", label: "Ancillary Tests", icon: Activity },
  { value: "anteriorSegment", label: "Anterior Segment", icon: Microscope },
  { value: "posteriorSegment", label: "Posterior Segment", icon: ScanEye },
  { value: "plan", label: "Diagnosis & Plan", icon: Edit3 },
];

const TwoColumnField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="md:grid md:grid-cols-3 md:gap-3 items-start">
    <FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">{label}</FormLabel>
    <div className="md:col-span-2 mt-1 md:mt-0">{children}</div>
  </div>
);

const CheckboxGroup = ({
  form,
  name,
  items,
  eyeLabel,
}: {
  form: UseFormReturn<FullOptometryCaseFormValues>;
  name: keyof FullOptometryCaseFormValues;
  items: { id: string; label: string }[];
  eyeLabel?: string;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={() => (
      <FormItem>
        {eyeLabel && <FormLabel className="text-xs text-muted-foreground">{eyeLabel}</FormLabel>}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {items.map((item) => (
            <FormField
              key={item.id}
              control={form.control}
              name={name}
              render={({ field }) => {
                const fieldValue = Array.isArray(field.value) ? field.value : [];
                return (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={fieldValue.includes(item.id)}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...fieldValue, item.id]
                            : fieldValue.filter((value) => value !== item.id);
                          field.onChange(updatedValue);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
);

const VA_OPTIONS = ["6/6 (20/20)", "6/9 (20/30)", "6/12 (20/40)", "6/18 (20/60)", "6/24 (20/80)", "6/36 (20/120)", "6/60 (20/200)", "CF", "HM", "PL/PR", "NPL"];

const VisualAcuityDoubleFormField = ({
  form,
  nameOD,
  nameOS,
  label,
}: {
  form: UseFormReturn<FullOptometryCaseFormValues>;
  nameOD: keyof FullOptometryCaseFormValues;
  nameOS: keyof FullOptometryCaseFormValues;
  label: string;
}) => (
  <div className="md:grid md:grid-cols-3 md:gap-3 items-center">
    <FormLabel className="md:col-span-1 text-right">{label}</FormLabel>
    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={nameOD}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <Input {...field} placeholder="OD..." />
              <Select onValueChange={(value) => form.setValue(nameOD, value, { shouldValidate: true })}>
                <SelectTrigger className="w-[60px] shrink-0" />
                <SelectContent>
                  {VA_OPTIONS.map(opt => <SelectItem key={`${nameOD}-${opt}`} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={nameOS}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <Input {...field} placeholder="OS..." />
              <Select onValueChange={(value) => form.setValue(nameOS, value, { shouldValidate: true })}>
                <SelectTrigger className="w-[60px] shrink-0" />
                <SelectContent>
                  {VA_OPTIONS.map(opt => <SelectItem key={`${nameOS}-${opt}`} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

const InputWithSelect = ({
  form,
  name,
  label,
  options,
  placeholder,
}: {
  form: UseFormReturn<FullOptometryCaseFormValues>;
  name: keyof FullOptometryCaseFormValues;
  label: string;
  options: string[];
  placeholder?: string;
}) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <TwoColumnField label={label}>
          <div className="flex items-center gap-1">
            <Input {...field} value={field.value as string || ''} placeholder={placeholder} />
            <Select onValueChange={(value) => form.setValue(name, value, { shouldValidate: true })}>
              <SelectTrigger className="w-[60px] shrink-0" />
              <SelectContent>
                {options.map(opt => <SelectItem key={`${name}-${opt}`} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FormMessage />
        </TwoColumnField>
      </FormItem>
    )}
  />
);

const PrismSingleEyeFormField = ({ form, diopterName, baseName, eyeLabel }: { form: UseFormReturn<FullOptometryCaseFormValues>, diopterName: keyof FullOptometryCaseFormValues, baseName: keyof FullOptometryCaseFormValues, eyeLabel: string }) => (
    <FormItem>
        <FormLabel className="text-xs text-muted-foreground">{eyeLabel}</FormLabel>
        <div className="flex items-start gap-2">
            <FormField
                control={form.control}
                name={diopterName}
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                            <Input placeholder="Diopters (Δ)" {...field} value={field.value as string || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name={baseName}
                render={({ field }) => (
                    <FormItem className="w-[100px] shrink-0">
                        <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Base" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="UP">UP</SelectItem>
                                <SelectItem value="DOWN">DOWN</SelectItem>
                                <SelectItem value="IN">IN</SelectItem>
                                <SelectItem value="OUT">OUT</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    </FormItem>
);

const PrismDoubleFormField = ({ form, label }: { form: UseFormReturn<FullOptometryCaseFormValues>, label: string }) => (
  <div className="md:grid md:grid-cols-3 md:gap-3 items-start">
    <FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">{label}</FormLabel>
    <div className="md:col-span-2 mt-1 md:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PrismSingleEyeFormField form={form} diopterName="prismDioptersOD" baseName="prismBaseOD" eyeLabel="OD (Right Eye)" />
        <PrismSingleEyeFormField form={form} diopterName="prismDioptersOS" baseName="prismBaseOS" eyeLabel="OS (Left Eye)" />
    </div>
  </div>
);


export default function LogNewCasePage() {
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
  
  const TABS_CONFIG = React.useMemo(() => TABS_CONFIG_BASE.map(tab => ({ ...tab, ref: React.createRef<HTMLDivElement>() })), []);
  const isScrollingProgrammatically = React.useRef(false);

  const memoizedInitialStoredCases = React.useMemo<StoredOptometryCase[]>(() => [], []);
  const [storedCases, setStoredCases] = useLocalStorage<StoredOptometryCase[]>('optometryCases', memoizedInitialStoredCases);

  const [isAssistantSheetOpen, setIsAssistantSheetOpen] = React.useState(false);
  const [assistantMessages, setAssistantMessages] = React.useState<AssistantChatMessage[]>([]);
  const [currentAssistantInput, setCurrentAssistantInput] = React.useState('');
  const [isAssistantLoading, setIsAssistantLoading] = React.useState(false);
  const assistantScrollAreaRef = React.useRef<HTMLDivElement>(null);
  
  const form = useForm<FullOptometryCaseFormValues>({
    resolver: zodResolver(fullOptometryCaseSchema),
    defaultValues: defaultFormValues,
  });

  const desktopTabsScrollAreaRef = React.useRef<HTMLDivElement>(null); 
  const desktopTabsViewportRef = React.useRef<HTMLDivElement | null>(null); 
  const desktopTabsListRef = React.useRef<HTMLDivElement>(null); 
  
  const [canScrollDesktopLeft, setCanScrollDesktopLeft] = React.useState(false);
  const [canScrollDesktopRight, setCanScrollDesktopRight] = React.useState(false);
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
    const observerOptions = { root: null, rootMargin: '0px 0px -70% 0px', threshold: 0.1 };
    const currentObservers: IntersectionObserver[] = [];

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

    TABS_CONFIG.forEach(tabConfig => {
      if (tabConfig.ref.current) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(tabConfig.ref.current);
        currentObservers.push(observer);
      }
    });

    return () => {
      currentObservers.forEach(observer => observer.disconnect());
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
    form.reset(defaultFormValues); 
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
                <Textarea placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} value={field.value as string || ''} rows={rows || 3} className="resize-y" />
              ) : (
                <Input type={inputType || 'text'} placeholder={placeholder || `Enter ${label.toLowerCase()}...`} {...field} value={field.value as string || ''} />
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
                  <Textarea placeholder={placeholderOD || `OD...`} {...field} value={field.value as string || ''} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOD || `OD...`} {...field} value={field.value as string || ''} />
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
                  <Textarea placeholder={placeholderOS || `OS...`} {...field} value={field.value as string || ''} rows={rows || 2} className="resize-y" />
                ) : (
                  <Input placeholder={placeholderOS || `OS...`} {...field} value={field.value as string || ''} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  useEffect(() => {
    if (assistantScrollAreaRef.current) {
      assistantScrollAreaRef.current.scrollTo({ top: assistantScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [assistantMessages]);

  const handleSendToAssistant = async () => {
    if (!currentAssistantInput.trim()) return;

    const newUserMessage: AssistantChatMessage = { id: Date.now().toString(), role: 'user', content: currentAssistantInput.trim() };
    setAssistantMessages(prev => [...prev, newUserMessage]);
    const currentInputForAI = currentAssistantInput;
    setCurrentAssistantInput('');
    setIsAssistantLoading(true);

    const sectionContext = TABS_CONFIG[currentTabIndex]?.label || "General";
    const formSnapshot = form.getValues();
    const historyForAI: AssistantGenkitChatMessage[] = assistantMessages.filter(msg => msg.role === 'user' || msg.role === 'assistant').map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] }));
    
    const aiInput: InteractiveEmrAssistantInput = { sectionContext, userMessage: currentInputForAI, formSnapshot, chatHistory: historyForAI };

    try {
      const result: InteractiveEmrAssistantOutput = await interactiveEmrAssistant(aiInput);
      const aiResponse: AssistantChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.aiResponseMessage };
      setAssistantMessages(prev => [...prev, aiResponse]);

      if (result.fieldsToUpdateJson) {
        try {
          const fieldsToUpdate = JSON.parse(result.fieldsToUpdateJson);
          if (fieldsToUpdate && typeof fieldsToUpdate === 'object' && Object.keys(fieldsToUpdate).length > 0) {
            const fieldUpdateMessages: string[] = [];
            for (const [key, value] of Object.entries(fieldsToUpdate)) {
              if (value !== undefined && value !== null && fullOptometryCaseSchema.shape.hasOwnProperty(key)) {
                // @ts-ignore
                form.setValue(key as keyof FullOptometryCaseFormValues, value, { shouldValidate: true, shouldDirty: true });
                fieldUpdateMessages.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
              }
            }
            if (fieldUpdateMessages.length > 0) {
                const systemUpdateMessage: AssistantChatMessage = { id: (Date.now() + 2).toString(), role: 'system', content: `AI updated: ${fieldUpdateMessages.join(', ')}.` };
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
      const errorResponse: AssistantChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}` };
      setAssistantMessages(prev => [...prev, errorResponse]);
      toast({ title: 'AI Assistant Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  useEffect(() => {
    if (isAssistantSheetOpen && assistantMessages.length === 0) { 
        const firstQuestion: AssistantChatMessage = { id: Date.now().toString(), role: 'assistant', content: `Hello! I'm Focus AI, your EMR assistant. We are in the "${TABS_CONFIG[currentTabIndex].label}" section. What information can I help you log first?` };
        setAssistantMessages([firstQuestion]);
    }
  }, [currentTabIndex, isAssistantSheetOpen, TABS_CONFIG, assistantMessages.length]);

  return (
    <MainLayout>
      <div className={cn("flex-1 flex flex-row h-full overflow-hidden")}>
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out py-8 px-4 sm:px-6 lg:px-8",
          isAssistantSheetOpen && !isMobile ? "lg:w-2/3 md:w-3/5" : "w-full"
        )}>
            <Card className="shadow-xl w-full flex-1 flex flex-col max-w-7xl mx-auto overflow-hidden">
            <CardHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b pb-4 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2"><ArrowLeft className="h-6 w-6 text-primary" /><span className="sr-only">Back</span></Button>
                    <CardTitle className="text-2xl md:text-3xl font-bold text-primary flex items-center text-center flex-grow justify-center"><FileTextIcon className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Log New Case</CardTitle>
                    <div className="w-10 h-10"></div>
                </div>
                 <div className={cn("mb-4 flex justify-center")}>
                    <Button variant="default" className="relative overflow-hidden shadow-lg hover:shadow-xl group rounded-md py-3 px-6" onClick={() => setIsAssistantSheetOpen(true)}>
                        <span className="absolute inset-0 w-full h-full block animate-shine-pass"><span className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"></span></span>
                        <Bot className="mr-2 h-5 w-5 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                        Focus AI Assistant
                    </Button>
                </div>
                
                <div className="h-14 flex items-center">
                    {isMobile ? (
                        <div className="flex items-center justify-between w-full px-2">
                            <Button variant="outline" size="icon" onClick={() => handleTabChange(Math.max(0, currentTabIndex - 1), true)} disabled={currentTabIndex === 0} aria-label="Previous Section"><ChevronLeft className="h-5 w-5" /></Button>
                            <div className="text-center flex items-center justify-center">
                            {TABS_CONFIG[currentTabIndex]?.icon && React.createElement(TABS_CONFIG[currentTabIndex].icon, { className: "mr-2 h-5 w-5 text-primary" })}
                            <span className="text-sm font-medium text-primary">{TABS_CONFIG[currentTabIndex]?.label}</span>
                            <span className="text-xs text-muted-foreground ml-1"> ({TABS_CONFIG[currentTabIndex] ? currentTabIndex + 1 : 0}/{TABS_CONFIG.length})</span>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => handleTabChange(Math.min(TABS_CONFIG.length - 1, currentTabIndex + 1), true)} disabled={currentTabIndex === TABS_CONFIG.length - 1} aria-label="Next Section"><ChevronRight className="h-5 w-5" /></Button>
                        </div>
                    ) : (
                       <Tabs value={TABS_CONFIG[currentTabIndex]?.value} onValueChange={(newTabValue) => { const newIndex = TABS_CONFIG.findIndex(tab => tab.value === newTabValue); if (newIndex !== -1) { handleTabChange(newIndex, false); } }} className="w-full">
                            <div className="flex items-center space-x-1 w-full">
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => handleDesktopTabScroll('left')} disabled={!canScrollDesktopLeft} aria-label="Scroll tabs left"><ChevronLeft className="h-5 w-5" /></Button>
                                <ScrollArea orientation="horizontal" className="flex-grow w-full pb-0 [&>[data-radix-scroll-area-scrollbar][data-orientation='horizontal']]:hidden" ref={desktopTabsScrollAreaRef}>
                                    <TabsList ref={desktopTabsListRef} className="border-b-0 whitespace-nowrap justify-start relative pl-1 pr-6">
                                    {TABS_CONFIG.map((tab, index) => (
                                        <TabsTrigger key={tab.value} value={tab.value} onClick={() => handleTabChange(index, false)} className={cn("px-3 py-2 text-sm font-medium rounded-md", currentTabIndex === index ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                                          <tab.icon className="mr-2 h-4 w-4" />{tab.label}
                                        </TabsTrigger>
                                    ))}
                                    </TabsList>
                                </ScrollArea>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => handleDesktopTabScroll('right')} disabled={!canScrollDesktopRight} aria-label="Scroll tabs right"><ChevronRight className="h-5 w-5" /></Button>
                            </div>
                        </Tabs>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1 flex flex-col overflow-hidden"> 
                <ScrollArea className="h-full flex-1 pr-2"> 
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0"> 
                    
                    {/* Patient Info */}
                    <div ref={TABS_CONFIG[0].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[0].label} icon={TABS_CONFIG[0].icon} />
                        <FormField control={form.control} name="posting" render={({ field }) => (<FormItem><TwoColumnField label="Posting"><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a posting type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="General OPD">General OPD</SelectItem><SelectItem value="Community OPD">Community OPD</SelectItem><SelectItem value="Retina OPD">Retina OPD</SelectItem></SelectContent></Select><FormMessage /></TwoColumnField></FormItem>)} />
                        {renderFormField('mrdNo', 'MRD No', 'Enter Medical Record Number')}
                        <FormField control={form.control} name="dateOfVisit" render={({ field }) => (<FormItem><TwoColumnField label="Date of Visit"><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date?.getTime())} initialFocus /></PopoverContent></Popover><FormMessage /></TwoColumnField></FormItem>)} />
                        {renderFormField('name', 'Name', 'e.g., John Doe')}
                        {renderFormField('age', 'Age', 'e.g., 25', false, undefined, 'number')}
                        <FormField control={form.control} name="sex" render={({ field }) => (<FormItem><TwoColumnField label="Sex"><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Other" /></FormControl><FormLabel className="font-normal">Other</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></TwoColumnField></FormItem>)} />
                    </div>

                    {/* History */}
                    <div ref={TABS_CONFIG[1].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[1].label} icon={TABS_CONFIG[1].icon} />
                        {renderFormField('chiefComplaint', 'Chief Complaints', '', true, 4)}
                        {renderFormField('pastOcularHistory', 'Past Ocular History', '', true, 3)}
                        {renderFormField('currentMedications', 'Current Medications', '', true, 3)}
                        {renderFormField('pastMedicalHistory', 'Past Medical History', '', true, 3)}
                        {renderFormField('recentInvestigations', 'Recent Investigations', '', true, 3)}
                        {renderFormField('familyHistory', 'Family History', '', true, 3)}
                        {renderFormField('allergies', 'Allergy History', '', true, 3)}
                        {renderFormField('birthHistory', 'Birth History', '', true, 3)}
                    </div>

                    {/* VA & Refraction */}
                    <div ref={TABS_CONFIG[2].ref as React.RefObject<HTMLDivElement>} className="space-y-8 py-2">
                        <SectionTitle title={TABS_CONFIG[2].label} icon={TABS_CONFIG[2].icon} />
                        <div className="p-4 border rounded-lg bg-card/50">
                            <h4 className="font-medium text-center mb-4">Visual Acuity</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm font-medium"><div className="md:col-start-2">OD (Right Eye)</div><div>OS (Left Eye)</div></div>
                            <VisualAcuityDoubleFormField form={form} nameOD="distanceUnaidedOD" nameOS="distanceUnaidedOS" label="Distance - Unaided" />
                            <VisualAcuityDoubleFormField form={form} nameOD="distancePinholeOD" nameOS="distancePinholeOS" label="Distance - Pinhole" />
                            <VisualAcuityDoubleFormField form={form} nameOD="distanceOldGlassesOD" nameOS="distanceOldGlassesOS" label="Distance - Old Glasses" />
                            <VisualAcuityDoubleFormField form={form} nameOD="nearUnaidedOD" nameOS="nearUnaidedOS" label="Near - Unaided" />
                            <VisualAcuityDoubleFormField form={form} nameOD="nearPinholeOD" nameOS="nearPinholeOS" label="Near - Pinhole" />
                            <VisualAcuityDoubleFormField form={form} nameOD="nearOldGlassesOD" nameOS="nearOldGlassesOS" label="Near - Old Glasses" />
                        </div>
                        <div className="p-4 border rounded-lg bg-card/50">
                            <h4 className="font-medium text-center mb-4">Previous Glasses Rx (PGP)</h4>
                            <div className="grid grid-cols-4 gap-2 text-center text-sm font-medium"><div className="col-start-2">Sph (D)</div><div>Cyl (D)</div><div>Axis</div></div>
                            <div className="grid grid-cols-4 gap-x-2 gap-y-2 items-center"><FormLabel className="text-right">OD</FormLabel><FormField control={form.control} name="pgpSphOD" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="pgpCylOD" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="pgpAxisOD" render={({ field }) => (<Input {...field} />)}/></div>
                            <div className="grid grid-cols-4 gap-x-2 gap-y-2 items-center mt-2"><FormLabel className="text-right">OS</FormLabel><FormField control={form.control} name="pgpSphOS" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="pgpCylOS" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="pgpAxisOS" render={({ field }) => (<Input {...field} />)}/></div>
                        </div>
                         <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                            <h4 className="font-medium text-center mb-2">Auto-Refractor Values</h4>
                            {renderDoubleFormField('autoRefractionOD', 'autoRefractionOS', 'Auto-Refraction', 'e.g., -1.00 / -0.50 x 180', 'e.g., -1.25 DS')}
                        </div>
                        <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                          <h4 className="font-medium text-center mb-2">Objective Refraction</h4>
                          {renderDoubleFormField('objRefractionOD', 'objRefractionOS', 'Retinoscopy Findings', 'e.g., -1.00 / -0.50 x 180', 'e.g., -1.25 DS')}
                          <div className="md:grid md:grid-cols-3 md:gap-3 items-start"><FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">Objective Findings</FormLabel><div className="md:col-span-2 mt-1 md:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4"><CheckboxGroup form={form} name="objRefractionFindingsOD" items={[{id: 'noGlow', label:'No Glow'},{id: 'dullGlow', label:'Dull Glow'},{id: 'centralOpacity', label:'Central Opacity'}]} eyeLabel="OD" /><CheckboxGroup form={form} name="objRefractionFindingsOS" items={[{id: 'noGlow', label:'No Glow'},{id: 'dullGlow', label:'Dull Glow'},{id: 'centralOpacity', label:'Central Opacity'}]} eyeLabel="OS" /></div></div>
                        </div>
                        <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                          <h4 className="font-medium text-center mb-2">Subjective Refraction</h4>
                          {renderDoubleFormField('subjRefractionOD', 'subjRefractionOS', 'Subjective Correction', 'e.g., -1.00 / -0.50 x 180', 'e.g., -1.25 DS')}
                          <div className="md:grid md:grid-cols-3 md:gap-3 items-start"><FormLabel className="md:col-span-1 md:mt-2 block text-sm font-medium text-muted-foreground">Subjective Checks</FormLabel><div className="md:col-span-2 mt-1 md:mt-0 grid grid-cols-1 sm:grid-cols-2 gap-4"><CheckboxGroup form={form} name="subjRefractionChecksOD" items={[{id: 'fogging', label:'Fogging'},{id: 'duochrome', label:'Duo chrome'},{id: 'jcc', label:'JCC'}]} eyeLabel="OD" /><CheckboxGroup form={form} name="subjRefractionChecksOS" items={[{id: 'fogging', label:'Fogging'},{id: 'duochrome', label:'Duo chrome'},{id: 'jcc', label:'JCC'}]} eyeLabel="OS" /></div></div>
                        </div>
                        <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                          <h4 className="font-medium text-center mb-2">Final Correction</h4>
                          {renderDoubleFormField('finalAcuityOD', 'finalAcuityOS', 'Visual Acuity w/ New Rx')}
                          <FormField control={form.control} name="finalCorrectionPreference" render={({ field }) => (<FormItem><TwoColumnField label="Decision"><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Prefers new glasses" /></FormControl><FormLabel className="font-normal">Prefers new glasses</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Continue same PGP" /></FormControl><FormLabel className="font-normal">Continue same PGP</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></TwoColumnField></FormItem>)} />
                          <InputWithSelect form={form} name="lensType" label="Lens Type" options={["Single Vision", "Bifocal", "Trifocal", "Progressive", "Occupational", "Other"]} placeholder="Enter lens type..." />
                          <PrismDoubleFormField form={form} label="Prism" />
                        </div>
                    </div>

                    {/* Ancillary Tests */}
                    <div ref={TABS_CONFIG[3].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[3].label} icon={TABS_CONFIG[3].icon} />
                        <div className="p-4 border rounded-lg bg-card/50 space-y-4">
                            <h4 className="font-medium mb-2 text-center">Keratometry</h4>
                            <div className="grid grid-cols-5 gap-2 text-center text-sm font-medium"><div className="col-start-2">Vertical</div><div>Horizontal</div><div className="col-start-2">Vertical</div><div>Horizontal</div></div>
                            <div className="grid grid-cols-5 gap-x-2 gap-y-2 items-center"><FormLabel className="text-right">OD</FormLabel><FormField control={form.control} name="keratometryVerticalOD" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="keratometryHorizontalOD" render={({ field }) => (<Input {...field} />)}/><FormLabel className="text-right col-start-1">OS</FormLabel><FormField control={form.control} name="keratometryVerticalOS" render={({ field }) => (<Input {...field} />)}/><FormField control={form.control} name="keratometryHorizontalOS" render={({ field }) => (<Input {...field} />)}/></div>
                            {renderFormField('keratometryComments', 'Comments', '', true, 2)}
                        </div>
                        {renderFormField('coverTest', 'Cover Test', 'e.g., orthophoria D&N')}
                        {renderFormField('eom', 'EOM', 'e.g., SAFE')}
                        <div className="md:grid md:grid-cols-3 md:gap-3 items-start"><FormLabel className="md:col-span-1 md:mt-2">NPC (cm)</FormLabel><div className="md:col-span-2 grid grid-cols-2 gap-4"><FormField control={form.control} name="npcSubj" render={({ field }) => (<FormItem><FormLabel className="text-xs">SUBJ</FormLabel><Input {...field} /></FormItem>)}/><FormField control={form.control} name="npcObj" render={({ field }) => (<FormItem><FormLabel className="text-xs">OBJEC</FormLabel><Input {...field} /></FormItem>)}/></div></div>
                        <div className="md:grid md:grid-cols-3 md:gap-3 items-start"><FormLabel className="md:col-span-1 md:mt-2">NPA (D)</FormLabel><div className="md:col-span-2 grid grid-cols-3 gap-4"><FormField control={form.control} name="npaOD" render={({ field }) => (<FormItem><FormLabel className="text-xs">OD</FormLabel><Input {...field} /></FormItem>)}/><FormField control={form.control} name="npaOS" render={({ field }) => (<FormItem><FormLabel className="text-xs">OS</FormLabel><Input {...field} /></FormItem>)}/><FormField control={form.control} name="npaOU" render={({ field }) => (<FormItem><FormLabel className="text-xs">OU</FormLabel><Input {...field} /></FormItem>)}/></div></div>
                        <div className="md:grid md:grid-cols-3 md:gap-3 items-start"><FormLabel className="md:col-span-1 md:mt-2">WFDT</FormLabel><div className="md:col-span-2 grid grid-cols-2 gap-4"><FormField control={form.control} name="wfdtDistance" render={({ field }) => (<FormItem><FormLabel className="text-xs">Distance</FormLabel><Input {...field} /></FormItem>)}/><FormField control={form.control} name="wfdtNear" render={({ field }) => (<FormItem><FormLabel className="text-xs">Near</FormLabel><Input {...field} /></FormItem>)}/></div></div>
                        {renderFormField('stereopsis', 'Stereopsis', 'e.g., 40 sec of arc')}
                    </div>

                    {/* Anterior Segment */}
                    <div ref={TABS_CONFIG[4].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[4].label} icon={TABS_CONFIG[4].icon} />
                        {renderFormField('pupillaryEvaluation', 'Pupillary Evaluation', '', true, 3)}
                        {renderFormField('externalExamination', 'External Examination', '', true, 3)}
                        <h4 className="font-medium text-muted-foreground pt-4">Slit Lamp Examination (Text substitute for diagram)</h4>
                        {renderDoubleFormField('lidsLashesOD', 'lidsLashesOS', 'Lids & Lashes', 'WNL', 'WNL', true, 2)}
                        {renderDoubleFormField('conjunctivaScleraOD', 'conjunctivaScleraOS', 'Conjunctiva & Sclera', 'Clear, quiet', 'Clear, quiet', true, 2)}
                        {renderDoubleFormField('corneaOD', 'corneaOS', 'Cornea', 'Clear, compact', 'Clear, compact', true, 2)}
                        {renderDoubleFormField('anteriorChamberOD', 'anteriorChamberOS', 'Anterior Chamber', 'Deep & quiet', 'Deep & quiet', true, 2)}
                        {renderDoubleFormField('irisOD', 'irisOS', 'Iris', 'Flat, intact', 'Flat, intact', true, 2)}
                        {renderDoubleFormField('lensOD', 'lensOS', 'Lens', 'Clear / Grade 1 NS', 'Clear / Grade 1 NS', true, 2)}
                        <h4 className="font-medium text-muted-foreground pt-4">Tonometry</h4>
                        {renderDoubleFormField('tonometryPressureOD', 'tonometryPressureOS', 'Pressure (mmHg)')}
                        <FormField control={form.control} name="tonometryMethod" render={({ field }) => (<FormItem><TwoColumnField label="Method"><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger></FormControl><SelectContent><SelectItem value="GAT">GAT</SelectItem><SelectItem value="NCT">NCT</SelectItem><SelectItem value="Perkins">Perkins</SelectItem></SelectContent></Select></TwoColumnField></FormItem>)} />
                        {renderFormField('tonometryTime', 'Time', '', false, undefined, 'time')}
                        <h4 className="font-medium text-muted-foreground pt-4">Dry Eye Tests</h4>
                        {renderDoubleFormField('tbutOD', 'tbutOS', 'TBUT (sec)')}
                        {renderDoubleFormField('schirmerOD', 'schirmerOS', 'Schirmer\'s (mm)')}
                    </div>

                    {/* Posterior Segment */}
                    <div ref={TABS_CONFIG[5].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[5].label} icon={TABS_CONFIG[5].icon} />
                        <h4 className="font-medium text-muted-foreground">Fundus Examination (Text substitute for diagram)</h4>
                        {renderDoubleFormField('vitreousOD', 'vitreousOS', 'Vitreous', 'Clear, PVD', 'Clear', true, 2)}
                        {renderDoubleFormField('opticDiscOD', 'opticDiscOS', 'Optic Disc', 'Pink, sharp margins', 'Pink, sharp margins', true, 2)}
                        {renderDoubleFormField('cupDiscRatioOD', 'cupDiscRatioOS', 'Cup/Disc Ratio', '0.3', '0.35', false)}
                        {renderDoubleFormField('maculaOD', 'maculaOS', 'Macula', 'Flat, good foveal reflex', 'Flat, good foveal reflex', true, 2)}
                        {renderDoubleFormField('vesselsOD', 'vesselsOS', 'Vessels', 'Normal caliber and course', 'Normal caliber and course', true, 2)}
                        {renderDoubleFormField('peripheryOD', 'peripheryOS', 'Periphery (Dilated)', 'Flat, no breaks or lesions', 'Flat, no breaks or lesions', true, 3)}
                    </div>
                    
                    {/* Plan */}
                    <div ref={TABS_CONFIG[6].ref as React.RefObject<HTMLDivElement>} className="space-y-6 py-2">
                        <SectionTitle title={TABS_CONFIG[6].label} icon={TABS_CONFIG[6].icon} />
                        {renderFormField('diagnosis', 'Diagnosis', 'Enter diagnosis (e.g., Myopia, Presbyopia)', true, 4)}
                        {renderFormField('interventionPlanned', 'Intervention Planned', 'Describe the management plan', true, 5)}
                        {renderFormField('learning', 'Learning / Reflection', 'What were the key learning points from this case?', true, 4)}
                    </div>

                    <div className="flex justify-end space-x-3 pt-8 mt-8 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => {form.reset(defaultFormValues); setAssistantMessages([]);}}>Clear Form</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90"><Save className="mr-2 h-4 w-4" /> Save Case</Button>
                    </div>
                    </form>
                </Form>
                </ScrollArea>
            </CardContent>
            </Card>
        </div>
        
        {/* Desktop Side Panel */}
        <div className={cn("lg:w-1/3 md:w-2/5 flex-shrink-0 border-l bg-card shadow-lg flex-col h-full overflow-hidden", isMobile ? "hidden" : "flex", isAssistantSheetOpen ? "flex" : "hidden")}>
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary"><Bot className="h-6 w-6" />Focus AI Assistant</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsAssistantSheetOpen(false)}><X className="h-5 w-5" /><span className="sr-only">Close AI Assistant</span></Button>
            </div>
            <ScrollArea className="flex-grow p-4 space-y-4" ref={assistantScrollAreaRef}>
                {assistantMessages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm", message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : message.role === 'assistant' ? 'mr-auto bg-muted text-muted-foreground' : 'mx-auto bg-amber-100 text-amber-800 border border-amber-300 text-xs italic w-full')}>
                    {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                    <div className="flex-grow break-words prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0.5 last:mb-0" {...props} /> }}>{message.content}</ReactMarkdown></div>
                    {message.role === 'user' && <User className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />}
                </div>
                ))}
                {assistantMessages.length === 0 && !isAssistantLoading && ( <div className="text-center text-muted-foreground py-6"><Bot className="h-10 w-10 mx-auto mb-2 text-primary/50" /><p>Ask Focus AI to help fill this section, or provide details.</p><p className="text-xs mt-1">e.g., "Patient name is Jane Doe, age 42."</p></div> )}
                {isAssistantLoading && assistantMessages[assistantMessages.length -1]?.role === 'user' && ( <div className="flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm mr-auto bg-muted text-muted-foreground"><Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" /><p className="italic">Focus AI is thinking...</p></div> )}
            </ScrollArea>
            <div className="p-4 border-t bg-muted/50 flex-shrink-0">
                <div className="flex items-center gap-2 w-full">
                <Input type="text" placeholder="Type your EMR details or ask AI..." value={currentAssistantInput} onChange={(e) => setCurrentAssistantInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isAssistantLoading && handleSendToAssistant()} className="flex-grow bg-background focus:ring-primary" disabled={isAssistantLoading} />
                <Button onClick={handleSendToAssistant} disabled={isAssistantLoading || !currentAssistantInput.trim()} size="icon">{isAssistantLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}<span className="sr-only">Send to AI Assistant</span></Button>
                </div>
            </div>
        </div>
        
        {/* Mobile Sheet */}
        <Sheet open={isAssistantSheetOpen && isMobile} onOpenChange={setIsAssistantSheetOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-primary" />Focus AI Assistant</SheetTitle>
                <SheetDescription>Chat with AI to help fill the EMR for the current section: <span className="font-semibold text-primary">{TABS_CONFIG[currentTabIndex]?.label || "Details"}</span>.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow p-4 space-y-4" ref={assistantScrollAreaRef}>
                {assistantMessages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm", message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : message.role === 'assistant' ? 'mr-auto bg-muted text-muted-foreground' : 'mx-auto bg-amber-100 text-amber-800 border border-amber-300 text-xs italic w-full')}>
                    {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                    <div className="flex-grow break-words prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0.5 last:mb-0" {...props} /> }}>{message.content}</ReactMarkdown></div>
                    {message.role === 'user' && <User className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />}
                </div>
                ))}
                {assistantMessages.length === 0 && !isAssistantLoading && ( <div className="text-center text-muted-foreground py-6"><Bot className="h-10 w-10 mx-auto mb-2 text-primary/50" /><p>Ask Focus AI to help fill this section, or provide details.</p><p className="text-xs mt-1">e.g., "Patient name is Jane Doe, age 42."</p></div> )}
                {isAssistantLoading && assistantMessages[assistantMessages.length -1]?.role === 'user' && ( <div className="flex items-start gap-2.5 p-3 rounded-lg max-w-[90%] mb-2 text-sm mr-auto bg-muted text-muted-foreground"><Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" /><p className="italic">Focus AI is thinking...</p></div> )}
            </ScrollArea>
            <SheetFooter className="p-4 border-t bg-muted/50 flex-shrink-0">
                <div className="flex items-center gap-2 w-full">
                <Input type="text" placeholder="Type your EMR details or ask AI..." value={currentAssistantInput} onChange={(e) => setCurrentAssistantInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isAssistantLoading && handleSendToAssistant()} className="flex-grow bg-background focus:ring-primary" disabled={isAssistantLoading} />
                <Button onClick={handleSendToAssistant} disabled={isAssistantLoading || !currentAssistantInput.trim()} size="icon">{isAssistantLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}<span className="sr-only">Send to AI Assistant</span></Button>
                </div>
            </SheetFooter>
            </SheetContent>
        </Sheet>
      </div>
    </MainLayout>
  );
}
