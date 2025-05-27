
'use server';
/**
 * @fileOverview Analyzes an optometry case to find connections to relevant research articles.
 *
 * - analyzeOptometryCase - A function that handles the optometry case analysis process.
 * - AnalyzeOptometryCaseInput - The input type for the analyzeOptometryCase function.
 * - AnalyzeOptometryCaseOutput - The return type for the analyzeOptometryCase function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeOptometryCaseInputSchema = z.object({
  visualAcuity: z.string().describe('The patient\'s visual acuity.'),
  refraction: z.string().describe('The patient\'s refraction.'),
  ocularHealthStatus: z.string().describe('The patient\'s ocular health status.'),
  additionalNotes: z.string().optional().describe('Any additional notes about the case.'),
});
export type AnalyzeOptometryCaseInput = z.infer<typeof AnalyzeOptometryCaseInputSchema>;

const AnalyzeOptometryCaseOutputSchema = z.object({
  relevantResearchArticles: z.array(
    z.object({
      title: z.string().describe('The title of the research article.'),
      summary: z.string().describe('A summary of the research article.'),
      url: z.string().describe('The URL of the research article.'), // Removed .url() here
    })
  ).describe('A list of relevant research articles.'),
  caseInsights: z.string().describe('Insights and connections to relevant research.'),
});
export type AnalyzeOptometryCaseOutput = z.infer<typeof AnalyzeOptometryCaseOutputSchema>;

export async function analyzeOptometryCase(input: AnalyzeOptometryCaseInput): Promise<AnalyzeOptometryCaseOutput> {
  return analyzeOptometryCaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOptometryCasePrompt',
  input: {schema: AnalyzeOptometryCaseInputSchema},
  output: {schema: AnalyzeOptometryCaseOutputSchema},
  prompt: `You are an expert optometrist specializing in analyzing optometry cases and finding connections to relevant research articles.

You will use the following information about the patient case to identify relevant research and provide insights.

Visual Acuity: {{{visualAcuity}}}
Refraction: {{{refraction}}}
Ocular Health Status: {{{ocularHealthStatus}}}
Additional Notes: {{{additionalNotes}}}

Based on the case details, find relevant research articles and provide a summary of each article, including the title and URL.  Also include specific case insights and connections to the research.
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
