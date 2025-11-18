

import type { z } from 'genkit';

// Updated: Only caseInsights
export interface AnalyzeOptometryCaseOutput {
  caseInsights: string;
}

// Form data structure - based on the new detailed specification
export interface FullOptometryCaseData {
  // Patient & Visit Information
  posting?: string; // Dropdown: "General OPD", "Community OPD", etc.
  mrdNo?: string; // Medical Record Number
  dateOfVisit?: number; // Date picker timestamp
  name: string; 
  age?: number; 
  sex?: 'Male' | 'Female' | 'Other'; // Radio buttons
  
  // Patient History
  chiefComplaint: string;
  pastOcularHistory?: string;
  currentMedications?: string; // New field
  pastMedicalHistory?: string;
  recentInvestigations?: string; // New field
  familyHistory?: string; // Combines family ocular and medical
  birthHistory?: string;
  allergies?: string;

  // Visual Acuity
  distanceUnaidedOD?: string;
  distanceUnaidedOS?: string;
  distancePinholeOD?: string;
  distancePinholeOS?: string;
  distanceOldGlassesOD?: string;
  distanceOldGlassesOS?: string;
  nearUnaidedOD?: string;
  nearUnaidedOS?: string;
  nearPinholeOD?: string;
  nearPinholeOS?: string;
  nearOldGlassesOD?: string;
  nearOldGlassesOS?: string;
  
  // Refraction - Previous Glasses (PGP)
  pgpSphOD?: string;
  pgpCylOD?: string;
  pgpAxisOD?: string;
  pgpSphOS?: string;
  pgpCylOS?: string;
  pgpAxisOS?: string;

  // Auto Refractor
  autoRefractionOD?: string;
  autoRefractionOS?: string;

  // Refraction - Objective (Retinoscopy)
  objRefractionOD?: string; // Replaces previous manifest/cyclo fields for general notes
  objRefractionOS?: string;
  objRefractionFindingsOD?: string[]; // Checkboxes: 'No Glow', 'Dull Glow', 'Central Opacity'
  objRefractionFindingsOS?: string[];

  // Refraction - Subjective
  subjRefractionOD?: string; // Replaces previous manifest/cyclo fields for general notes
  subjRefractionOS?: string;
  subjRefractionChecksOD?: string[]; // Checkboxes: 'Fogging', 'Duo chrome', 'JCC'
  subjRefractionChecksOS?: string[];

  // Final Correction
  finalAcuityOD?: string;
  finalAcuityOS?: string;
  finalCorrectionPreference?: 'Prefers new glasses' | 'Continue same PGP'; // Radio
  lensType?: string;
  prismDioptersOD?: string;
  prismBaseOD?: string;
  prismDioptersOS?: string;
  prismBaseOS?: string;

  // Ancillary Ocular Tests
  keratometryVerticalOD?: string;
  keratometryHorizontalOD?: string;
  keratometryVerticalOS?: string;
  keratometryHorizontalOS?: string;
  keratometryComments?: string;
  coverTest?: string;
  eom?: string; // Extraocular Motility
  npcSubj?: string;
  npcObj?: string;
  npaOD?: string;
  npaOS?: string;
  npaOU?: string;
  wfdtDistance?: string;
  wfdtNear?: string;
  stereopsis?: string;

  // Binocular Vision Specific
  vergenceRanges?: string;
  ac_a_ratio?: string;
  relativeAccommodation?: string;


  // Slit Lamp & Anterior Segment
  pupillaryEvaluation?: string;
  externalExamination?: string;
  // Slit Lamp Diagram (Text Fields as substitute)
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
  // Tonometry
  tonometryPressureOD?: string;
  tonometryPressureOS?: string;
  tonometryMethod?: 'GAT' | 'NCT' | 'Perkins';
  tonometryTime?: string;
  // Dry Eye Tests
  tbutOD?: string;
  tbutOS?: string;
  schirmerOD?: string;
  schirmerOS?: string;

  // Posterior Segment
  // Fundus Diagram (Text Fields as substitute)
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
  
  // Final Plan
  diagnosis?: string; // Replaces 'assessment'
  interventionPlanned?: string; // Replaces 'plan'
  learning?: string; // Replaces 'reflection'
  
  // Deprecated/Legacy fields - keep for backward compatibility if needed, but hide from new forms.
  // Not including them for a fresh start based on the new spec.
}

// This is the main type that will be stored in localStorage and listed
export interface StoredOptometryCase extends FullOptometryCaseData {
  id: string;
  timestamp: number;
  templateId: string; // To identify which template was used
  analysis?: AnalyzeOptometryCaseOutput; 
  analysisError?: string; 
}

// Chat related types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenkitChatMessage {
  role: 'user' | 'model';
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
  fieldsToUpdateJson?: string;
  aiResponseMessage: string;
}

// For structuring EMR data from raw text
export interface StructureEmrDataInput {
  rawText: string;
}
export interface StructureEmrDataOutput {
  extractedDataJson: string;
}

// For converting sheet to text (step 1)
export interface ConvertSheetToEmrInput {
  imageDataUri?: string;
  rawText?: string;
}

export interface ConvertSheetToEmrOutput {
  extractedText: string;
}

// For formatting the extracted text into HTML
export interface FormatCaseSheetInput {
    rawText: string;
}

export interface FormatCaseSheetOutput {
    formattedHtml: string;
}
