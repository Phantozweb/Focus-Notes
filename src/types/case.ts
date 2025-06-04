
import type { z } from 'genkit';

// Updated: Only caseInsights
export interface AnalyzeOptometryCaseOutput {
  caseInsights: string;
}

// Form data structure - used by the Zod schema in cases/new/page.tsx
export interface FullOptometryCaseData {
  // Patient Info
  patientId?: string;
  name: string; 
  age?: number; 
  gender?: string;
  contactNumber?: string;
  email?: string;
  address?: string;

  // Chief Complaint
  chiefComplaint: string;
  presentIllnessHistory?: string;

  // History
  birthHistory?: string; 
  pastOcularHistory?: string;
  pastMedicalHistory?: string;
  familyOcularHistory?: string;
  familyMedicalHistory?: string;
  medications?: string;
  allergies?: string;

  // Examination
  visualAcuityUncorrectedOD?: string;
  visualAcuityUncorrectedOS?: string;
  visualAcuityCorrectedOD?: string;
  visualAcuityCorrectedOS?: string;
  pupils?: string;
  extraocularMotility?: string;
  intraocularPressureOD?: string;
  intraocularPressureOS?: string;
  confrontationVisualFields?: string;
  
  // Refraction
  manifestRefractionOD?: string;
  manifestRefractionOS?: string;
  cycloplegicRefractionOD?: string;
  cycloplegicRefractionOS?: string;
  autoRefractionOD?: string; 
  autoRefractionOS?: string; 
  currentSpectacleRx?: string;
  currentContactLensRx?: string;
  lensType?: string; // Added Lens Type
  prismDioptersOD?: string; // Added Prism Diopters OD
  prismBaseOD?: string; // Added Prism Base OD
  prismDioptersOS?: string; // Added Prism Diopters OS
  prismBaseOS?: string; // Added Prism Base OS


  // Slit Lamp
  lidsLashesOD?: string;
  lidsLashesOS?: string;
  conjunctivaScleraOD?: string;
  conjunctivaScleraOS?: string;
  corneaOD?: string;
  corneaOS?: string;
  anteriorChamberOD?: string;
  anteriorChamberOS?: string;
  irisOD?: string;
  irisOS?: string;
  lensOD?: string;
  lensOS?: string;

  // Posterior Segment
  vitreousOD?: string;
  vitreousOS?: string;
  opticDiscOD?: string;
  opticDiscOS?: string;
  cupDiscRatioOD?: string;
  cupDiscRatioOS?: string;
  maculaOD?: string;
  maculaOS?: string;
  vesselsOD?: string;
  vesselsOS?: string;
  peripheryOD?: string;
  peripheryOS?: string;

  // Investigations
  octFindings?: string;
  visualFieldFindings?: string;
  fundusPhotographyFindings?: string;
  otherInvestigations?: string;

  // Assessment & Plan
  assessment: string;
  plan: string;
  prognosis?: string;
  followUp?: string;

  // Notes & Reflection
  internalNotes?: string;
  reflection?: string;
}

// This is the main type that will be stored in localStorage and listed
export interface StoredOptometryCase extends FullOptometryCaseData {
  id: string;
  timestamp: number;
  analysis?: AnalyzeOptometryCaseOutput; 
  analysisError?: string; 
}

// Chat related types (re-added for the new AI assistant sidebar)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system'; // Added 'system' for AI updates confirmation
  content: string;
}

export interface GenkitChatMessage {
  role: 'user' | 'model'; // 'model' corresponds to 'assistant'
  parts: Array<{ text: string }>;
}

// For the case detail page chat
export interface ChatWithCaseInput {
  caseSummary: string;
  userQuery: string;
  chatHistory?: GenkitChatMessage[];
}

export interface ChatWithCaseOutput {
  aiResponse: string;
}

// For the interactive EMR assistant
export interface InteractiveEmrAssistantInput {
  sectionContext: string;
  userMessage: string;
  formSnapshot?: Record<string, any>;
  chatHistory?: GenkitChatMessage[];
}

export interface InteractiveEmrAssistantOutput {
  fieldsToUpdate?: Record<string, string | number | boolean | undefined | null>;
  aiResponseMessage: string;
}

