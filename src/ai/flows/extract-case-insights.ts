
// src/ai/flows/extract-case-insights.ts
'use server';

/**
 * @fileOverview Extracts key details and insights from a logged optometry case.
 *
 * - extractCaseInsights - A function that analyzes and summarizes the case details.
 * - ExtractCaseInsightsInput - The input type for the extractCaseInsights function.
 * - ExtractCaseInsightsOutput - The return type for the extractCaseInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractCaseInsightsInputSchema = z.object({
  visualAcuity: z.string().describe('Patient\'s visual acuity.'),
  refraction: z.string().describe('Patient\'s refraction details.'),
  ocularHealthStatus: z.string().describe('Description of the patient\'s ocular health.'),
  additionalNotes: z.string().describe('Any additional notes about the case.'),
});

export type ExtractCaseInsightsInput = z.infer<typeof ExtractCaseInsightsInputSchema>;

const ExtractCaseInsightsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key findings in the case.'),
  insights: z.string().describe('Key insights derived from the case details.'),
});

export type ExtractCaseInsightsOutput = z.infer<typeof ExtractCaseInsightsOutputSchema>;

export async function extractCaseInsights(input: ExtractCaseInsightsInput): Promise<ExtractCaseInsightsOutput> {
  return extractCaseInsightsFlow(input);
}

const extractCaseInsightsPrompt = ai.definePrompt({
  name: 'extractCaseInsightsPrompt',
  input: {schema: ExtractCaseInsightsInputSchema},
  output: {schema: ExtractCaseInsightsOutputSchema},
  prompt: `You are an expert optometrist summarizing patient case details.

  Based on the provided case information, create a concise summary and identify key insights that would be most relevant for quick review and decision-making.

  Visual Acuity: {{{visualAcuity}}}
  Refraction: {{{refraction}}}
  Ocular Health Status: {{{ocularHealthStatus}}}
  Additional Notes: {{{additionalNotes}}}

  Summary:
  Insights: `,
});

const extractCaseInsightsFlow = ai.defineFlow(
  {
    name: 'extractCaseInsightsFlow',
    inputSchema: ExtractCaseInsightsInputSchema,
    outputSchema: ExtractCaseInsightsOutputSchema,
  },
  async input => {
    const {output} = await extractCaseInsightsPrompt(input);
    if (!output) {
        console.error("Prompt 'extractCaseInsightsPrompt' did not return output for input:", input);
        throw new Error("AI prompt 'extractCaseInsightsPrompt' did not return the expected output.");
    }
    return output!;
  }
);

