
'use server';
/**
 * @fileOverview Analyzes an optometry case to provide insights.
 *
 * - analyzeOptometryCase - A function that handles the optometry case analysis process.
 * - AnalyzeOptometryCaseInput - The input type for the analyzeOptometryCase function.
 * - AnalyzeOptometryCaseOutput - The return type for the analyzeOptometryCase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalyzeOptometryCaseOutput as ApiOutput } from '@/types/case'; // Use updated type

const AnalyzeOptometryCaseInputSchema = z.object({
  visualAcuity: z.string().describe('The patient\'s visual acuity.'),
  refraction: z.string().describe('The patient\'s refraction.'),
  ocularHealthStatus: z.string().describe('The patient\'s ocular health status.'),
  additionalNotes: z.string().optional().describe('Any additional notes about the case.'),
});
export type AnalyzeOptometryCaseInput = z.infer<typeof AnalyzeOptometryCaseInputSchema>;

// Updated Output Schema: Only caseInsights
const AnalyzeOptometryCaseOutputSchema = z.object({
  caseInsights: z.string().describe('Key insights derived from the case details.'),
});
export type AnalyzeOptometryCaseOutput = z.infer<typeof AnalyzeOptometryCaseOutputSchema>;

export async function analyzeOptometryCase(input: AnalyzeOptometryCaseInput): Promise<ApiOutput> {
  const result = await analyzeOptometryCaseFlow(input);
  return result as ApiOutput; // Cast to ensure frontend type matches
}

const prompt = ai.definePrompt({
  name: 'analyzeOptometryCasePrompt',
  input: {schema: AnalyzeOptometryCaseInputSchema},
  output: {schema: AnalyzeOptometryCaseOutputSchema},
  prompt: `You are an expert optometrist specializing in analyzing optometry cases to provide concise insights.

You will use the following information about the patient case to generate key insights.

Visual Acuity: {{{visualAcuity}}}
Refraction: {{{refraction}}}
Ocular Health Status: {{{ocularHealthStatus}}}
Additional Notes: {{{additionalNotes}}}

Based on the case details, provide overall case insights. Focus on the most clinically relevant points.
`,
});

const analyzeOptometryCaseFlow = ai.defineFlow(
  {
    name: 'analyzeOptometryCaseFlow',
    inputSchema: AnalyzeOptometryCaseInputSchema,
    outputSchema: AnalyzeOptometryCaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
