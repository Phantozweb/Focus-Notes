
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

const ChatWithCaseInputSchema = z.object({
  caseSummary: z.string().describe('A detailed summary of the optometry case.'),
  userQuery: z.string().describe("The user's current question or message."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation so far.'),
});
export type ChatWithCaseInput = z.infer<typeof ChatWithCaseInputSchema>;

const ChatWithCaseOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user's query."),
});
export type ChatWithCaseOutput = z.infer<typeof ChatWithCaseOutputSchema>;


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


export async function chatWithCase(input: ChatWithCaseInput): Promise<ChatWithCaseOutput> {
  return chatWithCaseFlow(input);
}

const chatWithCaseFlow = ai.defineFlow(
  {
    name: 'chatWithCaseFlow',
    inputSchema: ChatWithCaseInputSchema,
    outputSchema: ChatWithCaseOutputSchema,
  },
  async (flowInput: ChatWithCaseInput) => {
    const fullPrompt = systemInstructionTemplate.replace('{{{caseSummary}}}', flowInput.caseSummary) + "\n\nUser: " + flowInput.userQuery;

    const generationResult = await ai.generate({
      prompt: fullPrompt,
      history: flowInput.chatHistory as GenkitChatMessage[], 
      model: 'googleai/gemini-2.0-flash', 
      config: {
        temperature: 0.5, 
        safetySettings: [ 
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      },
      // No output schema here, we'll take the raw text.
    });

    if (!generationResult) {
      console.error('CRITICAL_AI_DEBUG: The entire generationResult from ai.generate() was null or undefined.');
      throw new Error('AI service call returned no result (generationResult is null/undefined).');
    }

    if (!generationResult.response) {
      let detailMessage = 'AI service failed to provide a response envelope.';
      if (generationResult && generationResult.candidates && generationResult.candidates.length > 0) {
        const firstCandidate = generationResult.candidates[0];
        detailMessage += ` Finish Reason: ${firstCandidate.finishReason || 'N/A'}.`;
        if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.length > 0) {
          detailMessage += ` Safety Ratings: ${JSON.stringify(firstCandidate.safetyRatings)}.`;
        }
      }
      // Log the entire generationResult for deep inspection
      console.error('CRITICAL_AI_DEBUG:', detailMessage, 'Full generationResult object:', JSON.stringify(generationResult, null, 2));
      console.error('Prompt length:', fullPrompt.length, 'Chat history entries:', flowInput.chatHistory?.length || 0);
      throw new Error(detailMessage);
    }

    // Genkit 1.x: Access raw text via response.text
    const aiResponseText = generationResult.response.text;
    if (typeof aiResponseText !== 'string') {
      console.error('CRITICAL_AI_DEBUG: AI response text is not a string. Full response:', JSON.stringify(generationResult.response, null, 2));
      throw new Error('AI returned an invalid response format.');
    }

    return { aiResponse: aiResponseText };
  }
);
