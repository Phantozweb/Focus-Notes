
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
  model: 'googleai/gemini-1.5-pro-latest',
  prompt: `You are an expert data visualizer for an optometry EMR system called "Focus CaseX". Your task is to take raw, unstructured text from an optometry case and convert it into a well-structured, professional, and visually appealing HTML document styled with Tailwind CSS classes.

**Instructions:**

1.  **Analyze the Input**: Carefully parse the provided raw text to identify distinct sections (e.g., Patient Information, History, Visual Acuity, Refraction, Diagnosis, Plan).
2.  **Structure with HTML**: Use semantic HTML5 tags (\`h2\`, \`h3\`, \`p\`, \`table\`, \`thead\`, \`tbody\`, \`tr\`, \`td\`, \`strong\`).
3.  **Create Tables**: For structured data like Visual Acuity, Refraction, or Keratometry, YOU MUST organize it into HTML tables with clear headers (e.g., "OD", "OS", "Sph", "Cyl", "Axis").
4.  **Styling with Tailwind CSS**: Use Tailwind CSS utility classes within the HTML tags to style the document. DO NOT use <style> blocks or inline 'style' attributes. The final output must be a single string of HTML body content.
    *   **Branding**: Start with a main title: \`<h1 class="text-2xl font-bold text-primary border-b-2 border-primary pb-2 mb-4">Focus CaseX - Digital Case Sheet</h1>\`
    *   **Section Headers**: Use \`<h2>\` tags with classes like \`text-xl font-semibold text-primary mt-6 border-b pb-2"\`.
    *   **Tables**: Style tables with classes for borders, padding, and alternating row colors. For example: \`<table class="w-full mt-2 border-collapse">\`, \`<th class="border p-2 text-left bg-gray-100">\`, \`<td class="border p-2">\`.
    *   **General Look**: Ensure a clean, professional, and modern look suitable for a medical document.
5.  **Return Single HTML String**: The entire output must be a single, valid HTML string within the 'formattedHtml' field. It should be ready to be injected directly into a \`<div>\`. Do not include \`<html>\` or \`<body>\` tags.

**Example Snippet for a Table:**
\`\`\`html
<table class="w-full border-collapse mt-2">
  <thead>
    <tr class="bg-gray-100">
      <th class="border p-2 text-left">Visual Acuity</th>
      <th class="border p-2 text-left">OD</th>
      <th class="border p-2 text-left">OS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border p-2">Unaided</td>
      <td class="border p-2">20/40</td>
      <td class="border p-2">20/50</td>
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
