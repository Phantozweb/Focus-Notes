
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
const InteractiveEmrAssistantInputSchema = z.object({
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

const InteractiveEmrAssistantOutputSchema = z.object({
  fieldsToUpdateJson: z.string().optional().describe("A JSON string representing an object where keys are EMR form field names (e.g., 'name', 'age') and values are the data to update. Example: '{\"name\": \"John Doe\", \"age\": 45}'. If no fields need updating, this can be omitted or be an empty string or an empty JSON object string like '{}'."),
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
Current Form Data Snapshot (Review this to avoid asking for info already provided):
{{#each formSnapshot}}
- {{ @key }}: {{this}}
{{/each}}
{{else}}
The form is currently empty.
{{/if}}

Your Task, based on the user's message below:
1. Analyze the user's message in the context of the EMR section: "{{{sectionContext}}}".
2. Check the 'Current Form Data Snapshot'. Do NOT ask for information that is already filled unless the user explicitly wants to change it. If the user provides an update for an existing field, extract it.
3. If the user's message provides information that can directly fill one or more EMR form fields relevant to this section (refer to "Available EMR fields"), identify those fields and their values.
   - Populate the 'fieldsToUpdateJson' field with a JSON STRING. This string should represent an object where keys EXACTLY MATCH the EMR form field names (e.g., "name", "age", "chiefComplaint") and values are the data to update. Example: '{"name": "John Doe", "age": 45}'. If no fields need updating, this can be omitted or be an empty string or an empty JSON object string like '{}'.
   - For OD/OS specific fields, if the user says "Right eye 20/20", you should extract "visualAcuityUncorrectedOD": "20/20" or similar within the JSON string.
4. Formulate an 'aiResponseMessage'. This message should:
   - If data was extracted and fieldsToUpdateJson is populated: Briefly confirm what was updated (e.g., "Okay, I've noted the age as 30.") AND then ask a relevant, specific follow-up question for the *current section* ({{{sectionContext}}}).
   - If no specific data for known fields was extracted from the user's message OR if more information is needed for the current section: Ask a clear, guiding, and detailed follow-up question to help the user provide the next piece of information for "{{{sectionContext}}}".
     - For example, if section is "Chief Complaint" and user says "redness in right eye", ask about onset, duration, severity, pain, discharge, vision changes, etc. (e.g., "Redness in the right eye noted. When did this start? Is there any pain or discharge associated with it?").
     - When asking for data for specific fields, guide the user on the expected format:
       - For Visual Acuity fields (like \`visualAcuityUncorrectedOD\`): Suggest common formats. E.g., 'What is the uncorrected visual acuity for the right eye? Please use a format like 6/6, 20/20, or CF.'
       - For IOP fields (like \`intraocularPressureOD\`): Ask for a numerical value and mention units. E.g., 'What is the intraocular pressure for the right eye in mmHg?'
       - For Refraction fields (like \`manifestRefractionOD\`): Suggest the typical components. E.g., 'What is the manifest refraction for the right eye? Please include sphere, cylinder, axis, and add if applicable (e.g., -2.00 / -0.50 x 180 Add +2.00).'
     - After asking, try to extract the user's response into the corresponding field(s) in \`fieldsToUpdateJson\`.
   - If the user's input is unclear, ambiguous, or irrelevant to the current section, ask for clarification.
   - If the user asks a general question, try to answer it concisely or guide them back to data entry for the current section.
   - Be conversational and helpful. Avoid generic questions if specific follow-ups are more appropriate.

IMPORTANT:
- Stick to the current EMR section: "{{{sectionContext}}}".
- Ensure keys in the JSON string for 'fieldsToUpdateJson' are valid EMR field names. Values should be strings, numbers, or booleans.
- If the user provides multiple pieces of information, try to extract all relevant ones for the current section into the JSON string.
- Do not invent data. If the user's input is insufficient to fill a field, ask for more details.
- If the user simply says "hello" or similar, greet them and ask the first logical question for the '{{{sectionContext}}}', considering what might already be in the form snapshot.

Example Interaction (Section: Patient Info, Form Snapshot: {}, User message: "The patient is John Doe, he's 45.")
AI fieldsToUpdateJson: '{"name": "John Doe", "age": 45}'
AI aiResponseMessage: "Got it. Name set to John Doe and age to 45. What is Mr. Doe's contact number?"

Example Interaction (Section: Chief Complaint, Form Snapshot: {"name": "Jane"}, User message: "blurry vision for 2 weeks in OD")
AI fieldsToUpdateJson: '{"chiefComplaint": "blurry vision for 2 weeks in OD"}'
AI aiResponseMessage: "Okay, chief complaint for Jane noted as 'blurry vision for 2 weeks in OD'. Can you tell me more about this? For example, is it constant or intermittent? Any associated pain or floaters?"

Process the user's message now.
`;

const emrAssistantPrompt = ai.definePrompt(
  {
    name: 'interactiveEmrAssistantPrompt',
    input: { schema: EmrAssistantMainPromptInputSchema },
    output: { schema: InteractiveEmrAssistantOutputSchema },
    system: systemInstructionTemplate,
    prompt: `{{{currentUserMessage}}}`, // User's message is the main prompt content for this turn
    model: 'googleai/gemini-2.0-flash', 
    config: {
      temperature: 0.3, 
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

    if (!output || typeof output.aiResponseMessage !== 'string') { 
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
      return { aiResponseMessage: `Sorry, I encountered an issue processing your request: ${detailMessage}. Please try again or rephrase.` };
    }
    console.log("CRITICAL_AI_DEBUG: AI Assistant Output: ", JSON.stringify(output, null, 2));
    return output;

  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during interactiveEmrAssistantPrompt execution:', e);
    let errorMessage = e.message || 'Unknown error during AI processing.';
    if (e.cause && typeof e.cause === 'object' && e.cause.message) {
        errorMessage = `${errorMessage} (Cause: ${e.cause.message})`;
    } else if (e.details) {
        errorMessage = `${errorMessage} (Details: ${JSON.stringify(e.details)})`;
    }
    
    console.error('CRITICAL_AI_DEBUG: Inputs that may have caused error: userMessage:', flowInput.userMessage, 'sectionContext:', flowInput.sectionContext);
    return { aiResponseMessage: `Sorry, I encountered an error connecting to the AI assistant: ${errorMessage}` };
  }
}

    