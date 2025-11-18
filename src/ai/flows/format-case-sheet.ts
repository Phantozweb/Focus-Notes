
'use server';
/**
 * @fileOverview AI flow for taking raw, unstructured text and formatting it into a beautiful HTML case sheet.
 *
 * - formatCaseSheet - Takes raw text and returns a formatted HTML string.
 * - FormatCaseSheetInput - The input type (raw text).
 * - FormatCaseSheetOutput - The output type (HTML string).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export type FormatCaseSheetInput = z.infer<typeof FormatCaseSheetInputSchema>;
const FormatCaseSheetInputSchema = z.object({
  rawText: z.string().describe("Raw unstructured text extracted from a case document."),
});

export type FormatCaseSheetOutput = z.infer<typeof FormatCaseSheetOutputSchema>;
const FormatCaseSheetOutputSchema = z.object({
  formattedHtml: z.string().describe("A single HTML string representing the formatted case sheet. It should be styled with inline CSS or classes for a professional look and include Focus CaseX branding.")
});

const prompt = ai.definePrompt({
  name: 'formatCaseSheetPrompt',
  input: { schema: FormatCaseSheetInputSchema },
  output: { schema: FormatCaseSheetOutputSchema },
  model: 'googleai/gemini-2.5-pro',
  prompt: `You are an expert data visualizer for an optometry EMR system called "Focus CaseX". Your task is to take raw, unstructured text from an optometry case and convert it into a well-structured, professional, and visually appealing HTML document.

**Instructions:**

1.  **Analyze the Input**: Carefully parse the provided raw text to identify distinct sections (e.g., Patient Information, History, Visual Acuity, Refraction, Diagnosis, Plan).
2.  **Structure with HTML**: Use semantic HTML5 tags (\`h2\`, \`h3\`, \`p\`, \`table\`, \`thead\`, \`tbody\`, \`tr\`, \`td\`, \`strong\`).
3.  **Create Tables**: For structured data like Visual Acuity, Refraction, or Keratometry, YOU MUST organize it into HTML tables with clear headers (e.g., "OD", "OS", "Sph", "Cyl", "Axis").
4.  **Styling**: Use inline CSS within the HTML tags to style the document. DO NOT use <style> blocks. The final output must be a single string of HTML body content.
    *   **Branding**: Start with a main title: \`<h1 style="color: #205888; font-size: 24px; border-bottom: 2px solid #205888; padding-bottom: 10px; margin-bottom: 20px;">Focus CaseX - Digital Case Sheet</h1>\`
    *   **Section Headers**: Use \`<h2>\` tags with styling like \`style="color: #205888; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px;"\`.
    *   **Tables**: Style tables with borders, padding, and alternating row colors for readability (e.g., \`style="width: 100%; border-collapse: collapse;"\`). Use \`th\` for headers with a background color.
    *   **General Look**: Ensure a clean, professional, and modern look suitable for a medical document. Use a common sans-serif font family like Arial.
5.  **Return Single HTML String**: The entire output must be a single, valid HTML string within the 'formattedHtml' field. It should be ready to be injected directly into a \`<div>\`. Do not include \`<html>\` or \`<body>\` tags.

**Example Snippet for a Table:**
\`\`\`html
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Visual Acuity</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">OD</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">OS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Unaided</td>
      <td style="border: 1px solid #ddd; padding: 8px;">20/40</td>
      <td style="border: 1px solid #ddd; padding: 8px;">20/50</td>
    </tr>
  </tbody>
</table>
\`\`\`

**User Input to Process:**
Raw text: {{{rawText}}}

Analyze the input and generate the complete, styled HTML string now.
`
});

export async function formatCaseSheet(input: FormatCaseSheetInput): Promise<FormatCaseSheetOutput> {
  console.log("AI FLOW: Starting case sheet formatting...");
  
  const result = await prompt(input);
  const output = result.output;

  if (!output || !output.formattedHtml) {
    console.error("AI FLOW ERROR: The AI model did not return the expected formatted HTML.", result);
    throw new Error("Failed to format the case sheet. The AI model returned an invalid response.");
  }
  
  console.log("AI FLOW: Case sheet formatting successful.");
  return output;
}
