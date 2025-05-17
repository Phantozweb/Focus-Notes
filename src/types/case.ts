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
