
'use server';
/**
 * @fileOverview AI flow for interactively filling EMR form sections.
 *
 * - interactiveEmrAssistant - Guides user and extracts data for EMR form fields.
 * - InteractiveEmrAssistantInput - Input type for the exported flow function.
 * - InteractiveEmrAssistantOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenkitChatMessage } from '@/types/case'; // Reusing GenkitChatMessage

// This is the input type for the EXPORTED interactiveEmrAssistant function
export const InteractiveEmrAssistantInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on (e.g., 'Patient Info', 'Chief Complaint')."),
  userMessage: z.string().describe("The user's latest message or response to the AI."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form. Used by AI to avoid asking for information already provided or to understand context."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation with the EMR assistant so far.'),
});
export type InteractiveEmrAssistantInput = z.infer<typeof InteractiveEmrAssistantInputSchema>;

// This is the schema for the main inputs to the PROMPT itself (excluding history)
const EmrAssistantMainPromptInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form."),
  currentUserMessage: z.string().describe("The user's current message to be processed."),
});

export const InteractiveEmrAssistantOutputSchema = z.object({
  fieldsToUpdate: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Key-value pairs of EMR form fields to update based on the user's input. Keys must EXACTLY match the known EMR form field names (e.g., 'name', 'age', 'chiefComplaint', 'visualAcuityUncorrectedOD'). Values should be strings, numbers, or booleans as appropriate for the field."),
  aiResponseMessage: z.string().describe("AI's next message to the user. This could be a question to guide data entry for the current section, a confirmation of updated fields, a request for clarification, or an answer to a user's question."),
});
export type InteractiveEmrAssistantOutput = z.infer<typeof InteractiveEmrAssistantOutputSchema>;

// Known EMR field names for better prompting
const KNOWN_EMR_FIELDS = [
  // Patient Info
  "patientId", "name", "age", "gender", "contactNumber", "email", "address",
  // Chief Complaint
  "chiefComplaint", "presentIllnessHistory",
  // History
  "pastOcularHistory", "pastMedicalHistory", "familyOcularHistory", "familyMedicalHistory", "medications", "allergies",
  // Examination - Visual Acuity
  "visualAcuityUncorrectedOD", "visualAcuityUncorrectedOS", "visualAcuityCorrectedOD", "visualAcuityCorrectedOS",
  // Examination - General
  "pupils", "extraocularMotility", "intraocularPressureOD", "intraocularPressureOS", "confrontationVisualFields",
  // Refraction
  "manifestRefractionOD", "manifestRefractionOS", "cycloplegicRefractionOD", "cycloplegicRefractionOS", "currentSpectacleRx", "currentContactLensRx",
  // Slit Lamp - OD
  "lidsLashesOD", "conjunctivaScleraOD", "corneaOD", "anteriorChamberOD", "irisOD", "lensOD",
  // Slit Lamp - OS
  "lidsLashesOS", "conjunctivaScleraOS", "corneaOS", "anteriorChamberOS", "irisOS", "lensOS",
  // Posterior Segment - OD
  "vitreousOD", "opticDiscOD", "cupDiscRatioOD", "maculaOD", "vesselsOD", "peripheryOD",
  // Posterior Segment - OS
  "vitreousOS", "opticDiscOS", "cupDiscRatioOS", "maculaOS", "vesselsOS", "peripheryOS",
  // Investigations
  "octFindings", "visualFieldFindings", "fundusPhotographyFindings", "otherInvestigations",
  // Assessment & Plan
  "assessment", "plan", "prognosis", "followUp",
  // Notes & Reflection
  "internalNotes", "reflection"
].join(', ');

const systemInstructionTemplate = `You are Focus AI, an intelligent EMR assistant for optometry. Your role is to help the user efficiently fill out an optometry case record by asking guiding questions and extracting information from their responses to populate form fields.

Current EMR Section in Focus: {{{sectionContext}}}

Available EMR fields (example subset, adapt based on section): ${KNOWN_EMR_FIELDS}

{{#if formSnapshot}}
Current Form Data Snapshot:
{{#each formSnapshot}}
- {{ @key }}: {{this}}
{{/each}}
{{else}}
The form is currently empty.
{{/if}}

Your Task, based on the user's message below:
1. Analyze the user's message in the context of the EMR section: "{{{sectionContext}}}".
2. If the user's message provides information that can directly fill one or more EMR form fields relevant to this section (refer to "Available EMR fields"), identify those fields and their values.
   - Populate the 'fieldsToUpdate' object with this data. The keys in 'fieldsToUpdate' MUST EXACTLY MATCH the EMR form field names (e.g., "name", "age", "chiefComplaint").
   - For OD/OS specific fields, if the user says "Right eye 20/20", you should extract "visualAcuityUncorrectedOD": "20/20" or similar.
3. Formulate an 'aiResponseMessage'. This message should:
   - If data was extracted: Briefly confirm what was updated (e.g., "Okay, I've noted the age as 30.") AND then ask a relevant follow-up question for the *current section* ({{{sectionContext}}}).
   - If no specific data for known fields was extracted from the user's message OR if more information is needed for the current section: Ask a clear, guiding question to help the user provide the next piece of information for "{{{sectionContext}}}".
   - If the user's input is unclear, ambiguous, or irrelevant to the current section, ask for clarification.
   - If the user asks a general question, try to answer it concisely or guide them back to data entry for the current section.
   - Be conversational and helpful.

IMPORTANT:
- Stick to the current EMR section: "{{{sectionContext}}}".
- Ensure keys in 'fieldsToUpdate' are valid EMR field names.
- If the user provides multiple pieces of information, try to extract all relevant ones for the current section.
- Do not invent data. If the user's input is insufficient to fill a field, ask for more details.
- If the user simply says "hello" or similar, greet them and ask the first logical question for the '{{{sectionContext}}}'.

Example Interaction (Section: Patient Info, User message: "The patient is John Doe, he's 45.")
AI fieldsToUpdate: {"name": "John Doe", "age": 45}
AI aiResponseMessage: "Got it. Name set to John Doe and age to 45. What is Mr. Doe's contact number?"

Example Interaction (Section: Chief Complaint, User message: "blurry vision for 2 weeks")
AI fieldsToUpdate: {"chiefComplaint": "blurry vision for 2 weeks"}
AI aiResponseMessage: "Okay, chief complaint noted as 'blurry vision for 2 weeks'. Can you tell me more about the history of this present illness?"

Process the user's message now.
`;

const emrAssistantPrompt = ai.definePrompt(
  {
    name: 'interactiveEmrAssistantPrompt',
    input: { schema: EmrAssistantMainPromptInputSchema },
    output: { schema: InteractiveEmrAssistantOutputSchema },
    system: systemInstructionTemplate,
    prompt: `{{{currentUserMessage}}}`, // User's message is the main prompt content for this turn
    model: 'googleai/gemini-2.0-flash', // Consistent with other flows and your example
    config: {
      temperature: 0.3, // Slightly more focused for data extraction
      // Permissive safety settings for diagnostics - ADJUST FOR PRODUCTION
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      ],
    },
  }
);

export async function interactiveEmrAssistant(flowInput: InteractiveEmrAssistantInput): Promise<InteractiveEmrAssistantOutput> {
  console.log('CRITICAL_AI_DEBUG: Calling interactiveEmrAssistant flow with input:', {
    sectionContext: flowInput.sectionContext,
    userMessage: flowInput.userMessage,
    formSnapshotLength: flowInput.formSnapshot ? Object.keys(flowInput.formSnapshot).length : 0,
    chatHistoryLength: flowInput.chatHistory?.length || 0,
  });

  const mainPromptData = {
    sectionContext: flowInput.sectionContext,
    formSnapshot: flowInput.formSnapshot,
    currentUserMessage: flowInput.userMessage,
  };

  try {
    const result = await emrAssistantPrompt(
        mainPromptData,
        { history: flowInput.chatHistory }
    );

    const output = result.output;

    if (!output || typeof output.aiResponseMessage !== 'string') { // Check if output or aiResponseMessage is truly missing/invalid
      console.error('CRITICAL_AI_DEBUG: interactiveEmrAssistantPrompt did not return a valid output structure. Full result:', JSON.stringify(result, null, 2));
      let detailMessage = 'AI assistant prompt did not return the expected output structure (missing or invalid aiResponseMessage).';
      // @ts-ignore
      if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
        // @ts-ignore
        const firstCandidate = result.response.candidates[0];
        if (firstCandidate) {
            detailMessage += ` Finish Reason: ${firstCandidate.finishReason || 'N/A'}.`;
            if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.length > 0) {
                detailMessage += ` Safety Ratings: ${JSON.stringify(firstCandidate.safetyRatings)}.`;
            }
        } else {
            detailMessage += ' No valid candidate found in response.';
        }
      } else if (result && result.response) {
          detailMessage += ' No candidates found in response object.';
      } else if (result) {
          detailMessage += ' No response object in result from prompt execution.';
      } else {
          detailMessage += ' Prompt execution result itself is null or undefined.';
      }
      // Return a default error structure
      return { aiResponseMessage: `Sorry, I encountered an issue processing your request: ${detailMessage}. Please try again or rephrase.` };
    }
    console.log("CRITICAL_AI_DEBUG: AI Assistant Output: ", JSON.stringify(output, null, 2));
    return output;

  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during interactiveEmrAssistantPrompt execution:', e);
    let errorMessage = e.message || 'Unknown error during AI processing.';
    // Attempt to get more specific error if available (e.g., from a nested Genkit/API error)
    if (e.cause && typeof e.cause === 'object' && e.cause.message) {
        errorMessage = `${errorMessage} (Cause: ${e.cause.message})`;
    } else if (e.details) {
        errorMessage = `${errorMessage} (Details: ${JSON.stringify(e.details)})`;
    }
    
    console.error('CRITICAL_AI_DEBUG: Inputs that may have caused error: userMessage:', flowInput.userMessage, 'sectionContext:', flowInput.sectionContext);
    return { aiResponseMessage: `Sorry, I encountered an error connecting to the AI assistant: ${errorMessage}` };
  }
}

    