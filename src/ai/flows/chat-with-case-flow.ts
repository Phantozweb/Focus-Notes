
'use server';
/**
 * @fileOverview AI flow for chatting about an optometry case.
 *
 * - chatWithCase - A function that handles conversational queries about a case.
 * - ChatWithCaseInput - The input type for the chatWithCase function.
 * - ChatWithCaseOutput - The return type for the chatWithCase function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenkitChatMessage } from '@/types/case';

// Schema for the main inputs to the prompt itself (excluding history)
const ChatWithCasePromptInputSchema = z.object({
  caseSummary: z.string().describe('A detailed summary of the optometry case.'),
  userQuery: z.string().describe("The user's current question or message about the case."),
});

// Schema for the expected output from the AI
const ChatWithCaseOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user's query."),
});
export type ChatWithCaseOutput = z.infer<typeof ChatWithCaseOutputSchema>;

// This is the input type for the exported chatWithCase function
// It includes chatHistory, which will be passed as an option to the prompt.
const ChatWithCaseFlowInputSchema = ChatWithCasePromptInputSchema.extend({
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation so far.'),
});
export type ChatWithCaseInput = z.infer<typeof ChatWithCaseFlowInputSchema>;


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

const chatWithCasePrompt = ai.definePrompt(
  {
    name: 'chatWithCasePrompt',
    input: { schema: ChatWithCasePromptInputSchema },
    output: { schema: ChatWithCaseOutputSchema },
    system: systemInstructionTemplate, // System instructions with caseSummary placeholder
    prompt: `{{{userQuery}}}`,         // User's current query
    model: 'googleai/gemini-2.5-pro', // Align with default model
    // No explicit config/safetySettings for now, to mirror working insight flow.
    // Add if issues persist:
    // config: {
    //   safetySettings: [
    //     { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    //     { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    //     { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    //   ],
    // },
  }
);

export async function chatWithCase(flowInput: ChatWithCaseInput): Promise<ChatWithCaseOutput> {
  console.log('CRITICAL_AI_DEBUG: Calling chatWithCasePrompt with input:', {
    caseSummary: flowInput.caseSummary.substring(0, 200) + "...", // Log snippet
    userQuery: flowInput.userQuery,
  });
  if (flowInput.chatHistory && flowInput.chatHistory.length > 0) {
    const lastFewHistory = flowInput.chatHistory.slice(-3);
    console.log('CRITICAL_AI_DEBUG: Passing chatHistory (last 3 entries):', JSON.stringify(lastFewHistory.map(m => ({role: m.role, text: m.parts[0]?.text})), null, 2));
  }

  try {
    const promptExecutionResult = await chatWithCasePrompt(
      { // Main input for the prompt
        caseSummary: flowInput.caseSummary,
        userQuery: flowInput.userQuery,
      },
      { // Options for the prompt execution
        history: flowInput.chatHistory, // Pass GenkitChatMessage[] as history
      }
    );

    const output = promptExecutionResult.output;

    if (!output) {
      console.error('CRITICAL_AI_DEBUG: chatWithCasePrompt did not return an output object. Full result:', JSON.stringify(promptExecutionResult, null, 2));
      // Try to get more details if available
      let detailMessage = 'AI prompt did not return the expected output structure.';
      // @ts-ignore // Accessing internal Genkit properties for debugging
      if (promptExecutionResult.response?.candidates && promptExecutionResult.response.candidates.length > 0) {
        // @ts-ignore
        const firstCandidate = promptExecutionResult.response.candidates[0];
        detailMessage += ` Finish Reason: ${firstCandidate.finishReason || 'N/A'}.`;
        if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.length > 0) {
          detailMessage += ` Safety Ratings: ${JSON.stringify(firstCandidate.safetyRatings)}.`;
        }
      }
      throw new Error(detailMessage);
    }

    return output;

  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during chatWithCasePrompt execution:', e);
    // Log the full prompt inputs on error for easier debugging if it's a prompt-related API error
    if (e.message && (e.message.includes('prompt') || e.message.includes('API'))) {
        console.error('CRITICAL_AI_DEBUG: Inputs that may have caused error: userQuery:', flowInput.userQuery, 'caseSummary (first 500 chars):', flowInput.caseSummary.substring(0,500));
    }
    throw new Error(`AI chat flow execution failed: ${e.message || 'Unknown error'}`);
  }
}
