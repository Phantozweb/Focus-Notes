
'use server';
/**
 * @fileOverview AI flow for converting a physical case sheet image or raw text to structured EMR data.
 *
 * - convertSheetToEmr - Extracts text from an image/text and maps it to EMR fields.
 * - ConvertSheetToEmrInput - The input type (image data or raw text).
 * - ConvertSheetToEmrOutput - The output type (JSON string of EMR data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export type ConvertSheetToEmrInput = z.infer<typeof ConvertSheetToEmrInputSchema>;
const ConvertSheetToEmrInputSchema = z.object({
  imageDataUri: z.string().optional().describe("A photo of the case sheet as a data URI ('data:<mimetype>;base64,<data>')."),
  rawText: z.string().optional().describe("Raw unstructured text copied from a document or typed by the user."),
});

// MODIFIED: This flow now ONLY outputs the extracted raw text.
export type ConvertSheetToEmrOutput = z.infer<typeof ConvertSheetToEmrOutputSchema>;
const ConvertSheetToEmrOutputSchema = z.object({
  extractedText: z.string().describe("The raw, unstructured text extracted from the input image or text. This will be used for a preview before final structuring.")
});

const prompt = ai.definePrompt({
  name: 'convertSheetToEmrPrompt',
  input: { schema: ConvertSheetToEmrInputSchema },
  output: { schema: ConvertSheetToEmrOutputSchema },
  model: 'googleai/gemini-2.5-pro',
  prompt: `You are an expert AI assistant specializing in Optical Character Recognition (OCR) and text extraction. Your task is to analyze an image OR a block of raw text and extract ALL text content exactly as it appears.

  **Instructions:**

  1.  **Analyze the Input**: Carefully examine the provided image or raw text.
  2.  **Extract ALL Text**: If an image is provided, perform OCR to extract every word. If raw text is provided, use it directly.
  3.  **Return Raw Text**: Your final output MUST be only the raw, unstructured text in the 'extractedText' field. Do not summarize, format, or structure the text in any way. Preserve the original line breaks and spacing as much as possible.

  **User Input to Process:**
  {{#if imageDataUri}}Image of the case sheet: {{media url=imageDataUri}}{{/if}}
  {{#if rawText}}Raw text from case document: {{{rawText}}}{{/if}}
  
  Extract all text content now.
  `
});

export async function convertSheetToEmr(input: ConvertSheetToEmrInput): Promise<ConvertSheetToEmrOutput> {
  console.log("AI FLOW: Starting EMR text extraction (Step 1)...");
  if (!input.imageDataUri && !input.rawText) {
    throw new Error("Input must contain either an image URI or raw text.");
  }
  
  const result = await prompt(input);
  const output = result.output;

  if (!output || typeof output.extractedText !== 'string') {
    console.error("AI FLOW ERROR: The AI model did not return the expected raw text output.", result);
    throw new Error("Failed to extract text from the sheet. The AI model returned an invalid response.");
  }
  
  console.log("AI FLOW: Raw text extraction successful (Step 1).");
  return output;
}
