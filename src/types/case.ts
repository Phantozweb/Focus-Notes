
import type { z } from 'genkit';

// Updated: Only caseInsights
export interface AnalyzeOptometryCaseOutput {
  caseInsights: string;
}

// Form data structure - used by the Zod schema in cases/new/page.tsx
export interface FullOptometryCaseData {
  // Patient Info
  patientId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string;
  contactNumber?: string;
  email?: string;
  address?: string;

  // Chief Complaint
  chiefComplaint: string;
  presentIllnessHistory?: string;

  // History
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
  currentSpectacleRx?: string;
  currentContactLensRx?: string;

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
  analysis?: AnalyzeOptometryCaseOutput; // For AI analysis results (now only insights)
  analysisError?: string; // If AI analysis fails
}

// Types for chat removed
// export interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
//   id: string;
// }

// export interface GenkitChatMessage {
//   role: 'user' | 'model';
//   parts: Array<{ text: string }>;
// }

// export interface AskFocusAiInput {
//   caseSummary: string;
//   userQuery: string;
//   chatHistory?: GenkitChatMessage[];
// }

// export interface AskFocusAiOutput {
//   aiResponse: string;
// }

