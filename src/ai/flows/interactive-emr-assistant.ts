
'use server';
/**
 * @fileOverview AI flow for interactively filling EMR form sections.
 *
 * - interactiveEmrAssistant - Guides user and extracts data for EMR form fields.
 * - InteractiveEmrAssistantInput - Input type.
 * - InteractiveEmrAssistantOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { GenkitChatMessage } from '@/types/case'; // Reusing GenkitChatMessage

const InteractiveEmrAssistantInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on (e.g., 'Patient Info', 'Chief Complaint')."),
  userMessage: z.string().describe("The user's latest message or response to the AI."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form. Used by AI to avoid asking for information already provided or to understand context."),
  chatHistory: z.array(z.object({ // Consistent with ChatWithCaseFlow
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation with the EMR assistant so far.'),
});
export type InteractiveEmrAssistantInput = z.infer<typeof InteractiveEmrAssistantInputSchema>;

const InteractiveEmrAssistantOutputSchema = z.object({
  fieldsToUpdate: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Key-value pairs of EMR form fields to update based on the user's input. Keys must EXACTLY match the known EMR form field names (e.g., 'name', 'age', 'chiefComplaint', 'visualAcuityUncorrectedOD'). Values should be strings, numbers, or booleans as appropriate for the field."),
  aiResponseMessage: z.string().describe("AI's next message to the user. This could be a question to guide data entry for the current section, a confirmation of updated fields, a request for clarification, or an answer to a user's question."),
});
export type InteractiveEmrAssistantOutput = z.infer<typeof InteractiveEmrAssistantOutputSchema>;

// Known EMR field names for better prompting (subset for example)
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

User's latest message: "{{{userMessage}}}"

Available EMR fields (example subset, adapt based on section): ${KNOWN_EMR_FIELDS}

Conversation History (if any):
{{#if chatHistory}}
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{else}}
No previous messages in this assistant session.
{{/if}}

Your Task:
1. Analyze the user's message in the context of the EMR section: "{{{sectionContext}}}".
2. If the user's message provides information that can directly fill one or more EMR form fields relevant to this section, identify those fields and their values.
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

Example Interaction (Section: Patient Info):
User: The patient is John Doe, he's 45.
AI fieldsToUpdate: {"name": "John Doe", "age": 45}
AI aiResponseMessage: "Got it. Name set to John Doe and age to 45. What is Mr. Doe's contact number?"

Example Interaction (Section: Chief Complaint, AI asking first):
AI aiResponseMessage: "What is the patient's chief complaint?"
User: blurry vision for 2 weeks
AI fieldsToUpdate: {"chiefComplaint": "blurry vision for 2 weeks"}
AI aiResponseMessage: "Okay, chief complaint noted as 'blurry vision for 2 weeks'. Can you tell me more about the history of this present illness?"
`;

const emrAssistantPrompt = ai.definePrompt(
  {
    name: 'interactiveEmrAssistantPrompt',
    input: { schema: InteractiveEmrAssistantInputSchema },
    output: { schema: InteractiveEmrAssistantOutputSchema },
    system: systemInstructionTemplate,
    model: 'googleai/gemini-2.0-flash', // Consistent with other flows
    config: { // Permissive for diagnostics, adjust for production
      temperature: 0.5, // Slightly more creative for conversation but still factual for extraction
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      ],
    },
  }
);

export async function interactiveEmrAssistant(input: InteractiveEmrAssistantInput): Promise<InteractiveEmrAssistantOutput> {
  // Log inputs for easier debugging during development
  console.log('CRITICAL_AI_DEBUG: Calling interactiveEmrAssistant with input:', {
    sectionContext: input.sectionContext,
    userMessage: input.userMessage,
    formSnapshotLength: input.formSnapshot ? Object.keys(input.formSnapshot).length : 0,
    chatHistoryLength: input.chatHistory?.length || 0,
  });

  try {
    // Prepare prompt inputs. The userMessage is part of the system template here.
    // The actual 'prompt' to the model will be effectively just the user's last message,
    // but the system template carries the main instructions and context.
    // For definePrompt, the userMessage is effectively the 'prompt' part of the exchange.
    // The system template has {{{userMessage}}} but that's if we were to make it a single shot.
    // For conversational, Genkit expects the last user message as the main prompt content if history is provided.

    // Let's adjust the main prompt for clarity. The system prompt already has userMessage.
    // The 'prompt' field for definePrompt here refers to the final user turn.
    const promptInput = {
      sectionContext: input.sectionContext,
      userMessage: input.userMessage, // This will be the main content for the user's turn
      formSnapshot: input.formSnapshot,
      chatHistory: input.chatHistory,
    };
    
    const result = await emrAssistantPrompt(
        promptInput, // Main input for the prompt template
        { history: input.chatHistory } // Pass chat history as an option
    );

    const output = result.output;

    if (!output || !output.aiResponseMessage) {
      console.error('CRITICAL_AI_DEBUG: interactiveEmrAssistantPrompt did not return a valid output structure or aiResponseMessage. Full result:', JSON.stringify(result, null, 2));
      // @ts-ignore
      let detailMessage = 'AI assistant prompt did not return the expected output structure (missing aiResponseMessage).';
       // @ts-ignore
      if (result.response?.candidates && result.response.candidates.length > 0) {
           // @ts-ignore
        const firstCandidate = result.response.candidates[0];
        detailMessage += ` Finish Reason: ${firstCandidate.finishReason || 'N/A'}.`;
        if (firstCandidate.safetyRatings && firstCandidate.safetyRatings.length > 0) {
          detailMessage += ` Safety Ratings: ${JSON.stringify(firstCandidate.safetyRatings)}.`;
        }
      }
      return { aiResponseMessage: `Sorry, I encountered an issue: ${detailMessage}. Please try again.` };
    }
    console.log("AI Assistant Output: ", output);
    return output;

  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during interactiveEmrAssistantPrompt execution:', e);
    let errorMessage = e.message || 'Unknown error during AI processing.';
     if (e.response && e.response.data && e.response.data.error && e.response.data.error.message) {
        errorMessage = e.response.data.error.message;
    }
    return { aiResponseMessage: `Sorry, I encountered an error connecting to the AI assistant: ${errorMessage}` };
  }
}

