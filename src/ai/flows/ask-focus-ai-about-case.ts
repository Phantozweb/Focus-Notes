
'use server';
/**
 * @fileOverview Provides a conversational AI (Focus AI) to answer questions about an optometry case.
 *
 * - askFocusAiAboutCase - A function to interact with Focus AI regarding a case.
 * - AskFocusAiInput - The input type for the function.
 * - AskFocusAiOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenkitChatMessage } from '@/types/case'; // For structured history

const AskFocusAiInputClientSchema = z.object({
  caseSummary: z.string().describe("A detailed summary string of the optometry case."),
  userQuery: z.string().describe("The user's current question about the case."),
  chatHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.array(z.object({ text: z.string() })),
    })
  ).optional().describe("Previous conversation history, if any. Follows Genkit Content structure."),
});
export type AskFocusAiInput = z.infer<typeof AskFocusAiInputClientSchema>;


const AskFocusAiOutputSchema = z.object({
  aiResponse: z.string().describe("Focus AI's response to the user's query."),
});
export type AskFocusAiOutput = z.infer<typeof AskFocusAiOutputSchema>;


// This schema is for the prompt template's direct input, prepared by the flow
const PromptTemplateInputSchema = z.object({
  caseSummary: z.string(),
  // chatHistoryString: z.string(), // History will be passed directly to ai.generate
  currentQuery: z.string(),
});


export async function askFocusAiAboutCase(input: AskFocusAiInput): Promise<AskFocusAiOutput> {
  return askFocusAiFlow(input);
}

const systemInstruction = `You are Focus AI, an expert optometry learning assistant.
Your role is to help the user understand the provided optometry case better by answering their questions.
Base your answers ONLY on the information given in the case details below and the conversation history.
Do not invent information or use external knowledge beyond general optometry principles for interpretation.
If a question is outside the scope of the provided case, politely state that you can only discuss the current case.

Optometry Case Summary:
{{{caseSummary}}}`;


// The main prompt template just takes the current query, system prompt handles the rest
const focusAiPrompt = ai.definePrompt({
  name: 'focusAiCaseInteractionPrompt',
  input: { schema: PromptTemplateInputSchema }, // Will be caseSummary and currentQuery
  output: { schema: AskFocusAiOutputSchema },
  template: systemInstruction, // System instructions including case summary placeholder
  prompt: `{{{currentQuery}}}`, // The user's direct current query
});


const askFocusAiFlow = ai.defineFlow(
  {
    name: 'askFocusAiAboutCaseFlow',
    inputSchema: AskFocusAiInputClientSchema, // Takes caseSummary, userQuery, and GenkitChatMessage[] history
    outputSchema: AskFocusAiOutputSchema,
  },
  async (flowInput) => {
    // Prepare the input for the prompt (which includes the system message template)
    const promptTemplateData = {
      caseSummary: flowInput.caseSummary,
      currentQuery: flowInput.userQuery, // This will fill the main prompt part
    };

    // Call the prompt which has the system message embedded.
    // History is passed separately to the generate call.
    const { response } = await ai.generate({
        prompt: flowInput.userQuery, // User's message
        system: focusAiPrompt.template.source.replace('{{{caseSummary}}}', flowInput.caseSummary), // Render system prompt
        history: flowInput.chatHistory, // Pass structured history
        output: { schema: AskFocusAiOutputSchema },
        model: ai.getModel('googleai/gemini-2.0-flash'), // Ensure a chat-capable model
      });
    
    const output = response.output();
    if (!output) {
      throw new Error("AI did not return a response.");
    }
    return output;
  }
);
