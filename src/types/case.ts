
import type { AnalyzeOptometryCaseOutput } from '@/ai/flows/analyze-optometry-case';

export interface OptometryCase {
  id: string;
  timestamp: number;
  visualAcuity: string;
  refraction: string;
  ocularHealthStatus: string;
  additionalNotes?: string;
}

export interface AnalyzedOptometryCase extends OptometryCase {
  analysis?: AnalyzeOptometryCaseOutput;
  analysisError?: string;
}

// New type for the comprehensive EMR-style form
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
