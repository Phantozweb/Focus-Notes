
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


const systemInstructionTemplate = `You are Focus AI, an expert optometry learning assistant.
Your primary goal is to help the user understand the detailed optometry case provided below.

**IMPORTANT INSTRUCTION:** Before answering any questions, carefully review the entire <OptometryCaseSummary> provided below. All your responses MUST be based SOLELY on this summary and the ongoing chat history.

YOU MUST BASE YOUR RESPONSES **SOLELY** ON THE INFORMATION CONTAINED WITHIN THE <OptometryCaseSummary> XML TAGS and the ongoing conversation history.
DO NOT USE ANY EXTERNAL KNOWLEDGE or invent information.
If a question cannot be answered from the provided case details, or if it is outside the scope of the current case, YOU MUST POLITELY STATE that the information is not available in this specific case.

<OptometryCaseSummary>
{{{caseSummary}}}
</OptometryCaseSummary>

Remember, your knowledge is strictly limited to the case summary provided above and the chat history. Please proceed to answer the user's query about THIS case.`;


export async function askFocusAiAboutCase(input: AskFocusAiInput): Promise<AskFocusAiOutput> {
  return askFocusAiFlow(input);
}

const askFocusAiFlow = ai.defineFlow(
  {
    name: 'askFocusAiAboutCaseFlow',
    inputSchema: AskFocusAiInputClientSchema,
    outputSchema: AskFocusAiOutputSchema, // Still define the flow's output schema for type safety
  },
  async (flowInput) => {
    const renderedSystemInstruction = systemInstructionTemplate.replace('{{{caseSummary}}}', flowInput.caseSummary);
    const fullPrompt = `${renderedSystemInstruction}\n\nUser: ${flowInput.userQuery}\nFocus AI:`;

    const generationResult = await ai.generate({
        prompt: fullPrompt,
        history: flowInput.chatHistory,
        model: 'googleai/gemini-1.5-flash-latest', // Keep this consistent and robust model
        // Temporarily remove output schema to get raw text.
        // We will manually construct the AskFocusAiOutputSchema if text is received.
        // output: { schema: AskFocusAiOutputSchema }, 
        config: {
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ],
        },
      });
    
    if (!generationResult || !generationResult.response) {
      let detailMessage = 'AI service failed to provide a response envelope.';
      if (generationResult && generationResult.candidates && generationResult.candidates.length > 0) {
        const firstCandidate = generationResult.candidates[0];
        const finishReason = firstCandidate.finishReason;
        const safetyRatings = firstCandidate.safetyRatings;
        detailMessage += ` Potential issue: FinishReason - ${finishReason || 'unknown'}.`;
        if (safetyRatings && safetyRatings.length > 0) {
          detailMessage += ` SafetyRatings: ${JSON.stringify(safetyRatings)}.`;
        }
      }
      // Log the entire generationResult for deep inspection
      console.error(detailMessage, 'Full generationResult:', JSON.stringify(generationResult, null, 2));
      throw new Error(detailMessage);
    }

    // Genkit 1.x: Access raw text via response.text
    const aiTextResponse = generationResult.response.text; 

    if (typeof aiTextResponse === 'undefined' || aiTextResponse === null || aiTextResponse.trim() === "") {
        // This block handles cases where a response envelope exists, but no text content.
        const finishReason = generationResult.response.candidates?.[0]?.finishReason;
        const safetyRatings = generationResult.response.candidates?.[0]?.safetyRatings;
        // Log the entire generationResult for deep inspection
        console.error('AI response envelope was present, but did not contain text or contained empty text.', { finishReason, safetyRatings, generationResult: JSON.stringify(generationResult, null, 2) });
        throw new Error(`AI did not return usable text. Finish reason: ${finishReason || 'unknown'}`);
    }
    
    // Manually structure the output to match AskFocusAiOutputSchema
    return { aiResponse: aiTextResponse };
  }
);

    