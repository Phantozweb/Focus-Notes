
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
import type { GenkitChatMessage } from '@/types/case'; // Keep this for input type

const ChatWithCaseInputSchema = z.object({
  caseSummary: z.string().describe('A detailed summary of the optometry case.'),
  userQuery: z.string().describe("The user's current question or message."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation so far.'),
});
export type ChatWithCaseInput = z.infer<typeof ChatWithCaseInputSchema>;

const AskFocusAiOutputSchema = z.object({
  aiResponse: z.string().describe("The AI's response to the user's query."),
});
export type ChatWithCaseOutput = z.infer<typeof AskFocusAiOutputSchema>;


const systemInstructionTemplate = `You are Focus AI, an expert optometry learning assistant.
Your primary goal is to help the user understand the detailed optometry case provided below.
YOU MUST BASE YOUR RESPONSES **SOLELY** ON THE INFORMATION CONTAINED WITHIN THE <OptometryCaseSummary> AND THE <ChatHistory> XML TAGS.
DO NOT USE ANY EXTERNAL KNOWLEDGE or invent information.
If a question cannot be answered from the provided details, POLITELY STATE that the information is not available.

<OptometryCaseSummary>
{{{caseSummary}}}
</OptometryCaseSummary>
`;

export async function chatWithCase(flowInput: ChatWithCaseInput): Promise<ChatWithCaseOutput> {
  // 1. Construct chat history string for inlining
  let historyString = "<ChatHistory>\n";
  if (flowInput.chatHistory && flowInput.chatHistory.length > 0) {
    flowInput.chatHistory.forEach(msg => {
      // Assuming msg.parts[0].text exists and is the primary content
      historyString += `${msg.role === 'user' ? 'User' : 'FocusAI'}: ${msg.parts[0]?.text || ''}\n`;
    });
  } else {
    historyString += "No previous messages in this session.\n";
  }
  historyString += "</ChatHistory>\n\n";

  // 2. Construct the full prompt
  const systemSegment = systemInstructionTemplate.replace('{{{caseSummary}}}', flowInput.caseSummary);
  const fullPrompt = systemSegment + historyString + `Current User Query: ${flowInput.userQuery}`;

  console.log('CRITICAL_AI_DEBUG: Preparing to call ai.generate() with:');
  console.log('CRITICAL_AI_DEBUG: Full Prompt (first 500 chars):', fullPrompt.substring(0, 500));
  if (flowInput.chatHistory && flowInput.chatHistory.length > 0) {
    const lastFewHistory = flowInput.chatHistory.slice(-3); // Log last 3 for brevity
    console.log('CRITICAL_AI_DEBUG: Chat History (last 3 entries for prompt):', JSON.stringify(lastFewHistory.map(m => ({role: m.role, text: m.parts[0]?.text})), null, 2));
  }
  console.log('CRITICAL_AI_DEBUG: Model:', 'googleai/gemini-2.0-flash');


  let generationResult;
  try {
    generationResult = await ai.generate({
      prompt: fullPrompt,
      // History parameter is intentionally omitted; history is now in fullPrompt
      model: 'googleai/gemini-2.0-flash',
      // Config block (temperature, safety settings) is currently removed for maximum simplicity
    });
  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during ai.generate() call:', e);
    // Log the full prompt on error for easier debugging if it's a prompt-related API error
    if (e.message && e.message.includes('prompt')) {
        console.error('CRITICAL_AI_DEBUG: Full prompt that may have caused error:', fullPrompt);
    }
    throw new Error(`AI generation call failed: ${e.message || 'Unknown error'}`);
  }
  

  if (!generationResult) {
    console.error('CRITICAL_AI_DEBUG: The entire generationResult from ai.generate() was null or undefined.');
    throw new Error('AI service call returned no result (generationResult is null/undefined).');
  }

  if (!generationResult.response) {
    let detailMessage = 'AI service failed to provide a response envelope.';
    if (generationResult.candidates && generationResult.candidates.length > 0) {
      const firstCandidate = generationResult.candidates[0];
      detailMessage += ` Finish Reason: ${firstCandidate.finishReason || 'N/A'}.`;
      if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.length > 0) {
        detailMessage += ` Safety Ratings: ${JSON.stringify(firstCandidate.safetyRatings)}.`;
      }
    }
    // Enhanced logging for this specific failure case
    console.error('CRITICAL_AI_DEBUG:', detailMessage, 'Prompt length:', fullPrompt.length, 'Chat history entries (in input):', flowInput.chatHistory?.length || 0);
    console.error('CRITICAL_AI_DEBUG: Full generationResult object:', JSON.stringify(generationResult, null, 2));
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
