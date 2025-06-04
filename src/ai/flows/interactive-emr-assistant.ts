
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
// Reusing GenkitChatMessage from full case types for consistency, but it can be defined here too.
import type { GenkitChatMessage } from '@/types/case'; 

// This is the input type for the EXPORTED interactiveEmrAssistant function
// It includes chatHistory, which will be passed as an option to the prompt.
export type InteractiveEmrAssistantInput = z.infer<typeof InteractiveEmrAssistantInputSchema>;
const InteractiveEmrAssistantInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on (e.g., 'Patient Info', 'Chief Complaint')."),
  userMessage: z.string().describe("The user's latest message or response to the AI."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form. Used by AI to avoid asking for information already provided or to understand context."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation with the EMR assistant so far.'),
});


// This is the schema for the main inputs to the PROMPT itself (excluding history)
const EmrAssistantMainPromptInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form."),
  currentUserMessage: z.string().describe("The user's current message to be processed."),
});


// This is the output type for the EXPORTED interactiveEmrAssistant function
// The schema here is for Genkit's `ai.definePrompt` output validation.
export type InteractiveEmrAssistantOutput = z.infer<typeof InteractiveEmrAssistantOutputSchema>;
const InteractiveEmrAssistantOutputSchema = z.object({
  fieldsToUpdateJson: z.string().optional().describe("A JSON string representing an object where keys are EMR form field names (e.g., 'name', 'age') and values are the data to update. Example: '{\"name\": \"John Doe\", \"age\": 45}'. If no fields need updating, this can be omitted or be an empty string or an empty JSON object string like '{}'."),
  aiResponseMessage: z.string().describe("AI's next message to the user. This could be a question to guide data entry for the current section, a confirmation of updated fields, a request for clarification, or an answer to a user's question."),
});

// Known EMR field names for better prompting
const KNOWN_EMR_FIELDS = [
  // Patient Info
  "patientId", "name", "age", "gender", "contactNumber", "email", "address",
  // Chief Complaint
  "chiefComplaint", "presentIllnessHistory",
  // History
  "birthHistory", "pastOcularHistory", "pastMedicalHistory", "familyOcularHistory", "familyMedicalHistory", "medications", "allergies",
  // Examination - Visual Acuity
  "visualAcuityUncorrectedOD", "visualAcuityUncorrectedOS", "visualAcuityCorrectedOD", "visualAcuityCorrectedOS",
  // Examination - General
  "pupils", "extraocularMotility", "intraocularPressureOD", "intraocularPressureOS", "confrontationVisualFields",
  // Refraction
  "manifestRefractionOD", "manifestRefractionOS", "cycloplegicRefractionOD", "cycloplegicRefractionOS", 
  "autoRefractionOD", "autoRefractionOS",
  "currentSpectacleRx", "currentContactLensRx",
  "lensType", "prismDioptersOD", "prismBaseOD", "prismDioptersOS", "prismBaseOS", // Added Lens Type & Prism fields
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

const systemInstructionTemplate = `You are Focus AI, an intelligent EMR assistant for optometry. Your role is to help the user efficiently fill out an optometry case record by asking guiding questions and extracting information from their responses to populate form fields. Maintain a professional and helpful tone.

Current EMR Section in Focus: {{{sectionContext}}}

Available EMR fields (example subset, adapt based on section): ${KNOWN_EMR_FIELDS}

{{#if formSnapshot}}
Current Form Data Snapshot (Review this to avoid asking for info already provided, and to understand context for updates):
{{#each formSnapshot}}
- {{ @key }}: {{this}}
{{/each}}
{{else}}
The form is currently empty.
{{/if}}

Your Task, based on the user's message below:
1. Analyze the user's message in the context of the EMR section: "{{{sectionContext}}}" and the ongoing conversation history.
2. Review the 'Current Form Data Snapshot' and recent chat history.
   - If the user's current message provides NEW information for an EMPTY field in the current section (or a field not recently discussed as being updated), extract it.
   - If the user's current message CLARIFIES, CORRECTS, or EXPANDS on information for a field that is ALREADY FILLED (either in the snapshot or from a very recent turn in this conversation), you MUST use the LATEST information provided by the user to update that field in 'fieldsToUpdateJson'.
   - Do NOT ask for information that is already satisfactorily filled and hasn't been mentioned by the user in the current or immediately preceding message unless the user is explicitly asking to change it.
3. If the user's message provides information that can directly fill one or more EMR form fields relevant to this section (refer to "Available EMR fields"), identify those fields and their values.
   - Populate the 'fieldsToUpdateJson' field with a JSON STRING. This string should represent an object where keys EXACTLY MATCH the EMR form field names (e.g., "name", "age", "chiefComplaint", "lensType", "prismDioptersOD", "prismBaseOD") and values are the data to update. Example: '{"name": "John Doe", "age": 45, "lensType": "Progressive", "prismDioptersOD": "2.0", "prismBaseOD": "BU"}'. If no fields need updating, this can be omitted or be an empty string or an empty JSON object string like '{}'.
   - For ophthalmology-specific findings (e.g., visual acuity, slit lamp, posterior segment, prism), if the user mentions specific eyes (right, left, both), try to reflect that using standard abbreviations like OD, OS, or OU within the extracted value IF APPROPRIATE for the field being updated. For example, if updating 'chiefComplaint' and the user says "redness in both eyes", the value might be "redness in both eyes (OU)". This depends on the specific field; some fields are inherently OD/OS specific (like prismDioptersOD).
4. Formulate an 'aiResponseMessage'. This message should:
   - If data was extracted and fieldsToUpdateJson is populated and non-empty:
     - Check if the updated field(s) were previously empty or significantly different in the form snapshot or very recent conversation.
     - If it's NEW information for a field: Confirm with a phrase like "Okay, I've noted the [field name] as '[value]'." or "Added [field name]: '[value]'."
     - If it's an UPDATE to existing information: Confirm with a phrase like "Understood. I've updated the [field name] to '[value]'." or "Updated [field name]: '[value]'."
     - THEN, ask a relevant, specific follow-up question for the *current section* ({{{sectionContext}}}). **Prioritize asking detailed clinical questions to fully explore the current topic/symptom before moving to other fields in the section.** For example, if the user mentions 'redness' in the 'Chief Complaint' section, ask about onset, duration, severity, pain, discharge, vision changes, etc., sequentially, before asking about an unrelated field like 'past ocular history' (if that's in a different section) or less critical fields in the current section if the main complaint isn't fully explored.
   - If no specific data for known fields was extracted from the user's message OR if more information is needed for the current section:
     - Ask a clear, guiding, and detailed follow-up question to help the user provide the next piece of information for "{{{sectionContext}}}".
     - **Questioning Strategy:**
       - When the user provides information for a field (e.g., a symptom in 'Chief Complaint'), before asking about completely different fields in the same section (especially less critical ones like 'address' or 'email' unless they are the primary topic for that section), try to ask 2-3 RELEVANT follow-up questions to explore the initial information more thoroughly.
       - For example, if section is "Chief Complaint" and user says "redness in right eye", your next questions should be about onset, duration, severity, pain, discharge, associated symptoms (like itching, watering, vision changes), etc., one by one.
       - Only after exhausting relevant follow-ups on the current topic should you move to other key fields in the current section, or indicate readiness for the next section if all key fields in the current section are covered.
       - When asking for data for specific fields, guide the user on the expected format:
         - For Visual Acuity fields (like \`visualAcuityUncorrectedOD\`): Suggest common formats. E.g., 'What is the uncorrected visual acuity for the right eye? Please use a format like 6/6, 20/20, or CF.'
         - For IOP fields (like \`intraocularPressureOD\`): Ask for a numerical value and mention units. E.g., 'What is the intraocular pressure for the right eye in mmHg?'
         - For Refraction fields (like \`manifestRefractionOD\` or \`autoRefractionOD\`): Suggest the typical components. E.g., 'What is the manifest refraction for the right eye? Please include sphere, cylinder, axis, and add if applicable (e.g., -2.00 / -0.50 x 180 Add +2.00).'
         - For Prism fields (like \`prismDioptersOD\` and \`prismBaseOD\`): Ask for diopters and base direction. E.g., 'Is there any prism for the right eye? If so, what are the diopters and base direction (e.g., 2.0 Base UP)?'
     - After asking, try to extract the user's response into the corresponding field(s) in \`fieldsToUpdateJson\`.
   - If the user's input is unclear, ambiguous, or irrelevant to the current section, ask for clarification.
   - If the user asks a general question, try to answer it concisely or guide them back to data entry for the current section.
   - Be conversational and helpful. Avoid generic questions if specific follow-ups are more appropriate.

IMPORTANT:
- Stick to the current EMR section: "{{{sectionContext}}}". **Prioritize asking detailed clinical questions relevant to the {{{sectionContext}}} over administrative details (like address, email in Patient Info) unless the user specifically brings them up or all key clinical aspects of the current section have been explored.**
- Ensure keys in the JSON string for 'fieldsToUpdateJson' are valid EMR field names. Values should be strings, numbers, or booleans.
- If the user provides multiple pieces of information, try to extract all relevant ones for the current section into the JSON string.
- Do not invent data. If the user's input is insufficient to fill a field, ask for more details.
- If the user simply says "hello" or similar, greet them and ask the first logical (often clinical) question for the '{{{sectionContext}}}', considering what might already be in the form snapshot.

Example Interaction (NEW info - Section: Patient Info, Form Snapshot: {}, User message: "The patient is John Doe, he's 45.")
AI fieldsToUpdateJson: '{"name": "John Doe", "age": 45}'
AI aiResponseMessage: "Got it. Name noted as John Doe and age as 45. What is Mr. Doe's contact number?" (Assuming contact number is a reasonable next step in Patient Info after name/age)

Example Interaction (UPDATING existing info - Section: Chief Complaint, Form Snapshot: {"chiefComplaint": "Redness in right eye for 1 day"}, User message: "The redness is actually in both eyes, and it started yesterday evening.")
AI fieldsToUpdateJson: '{"chiefComplaint": "Redness in both eyes, started yesterday evening"}'
AI aiResponseMessage: "Understood. I've updated the Chief Complaint to: Redness in both eyes, started yesterday evening. Is there any pain, itching, or discharge associated with this?"

Example Interaction (Section: Chief Complaint, Form Snapshot: {"name": "Jane"}, User message: "blurry vision for 2 weeks in OD")
AI fieldsToUpdateJson: '{"chiefComplaint": "blurry vision for 2 weeks in OD"}'
AI aiResponseMessage: "Okay, chief complaint for Jane noted as 'blurry vision for 2 weeks in OD'. Can you tell me more about this? For example, is it constant or intermittent? Any associated pain or floaters?"

Example Interaction (Section: Examination & Refraction, User message: "Patient uses progressive lenses. For OD, 2 prism diopters base up.")
AI fieldsToUpdateJson: '{"lensType": "Progressive", "prismDioptersOD": "2.0", "prismBaseOD": "UP"}'
AI aiResponseMessage: "Okay, I've noted the lens type as Progressive, and for the right eye, 2.0 prism diopters Base Up. What about the prism for the left eye?"


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
  if (flowInput.formSnapshot && Object.keys(flowInput.formSnapshot).length > 0) {
    console.log('CRITICAL_AI_DEBUG: Form snapshot (first 5 keys):', Object.fromEntries(Object.entries(flowInput.formSnapshot).slice(0,5)));
  }


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
    
    // More robust check for output structure
    if (!result || !result.output || typeof result.output.aiResponseMessage !== 'string') { 
      console.error('CRITICAL_AI_DEBUG: interactiveEmrAssistantPrompt did not return a valid output structure. Full result:', JSON.stringify(result, null, 2));
      let detailMessage = 'AI assistant prompt did not return the expected output structure (missing or invalid aiResponseMessage).';

      // Safely access candidate details
      const candidate = result?.response?.candidates?.[0];
      if (candidate) {
        detailMessage += ` Finish Reason: ${candidate.finishReason || 'N/A'}.`;
        if (candidate.safetyRatings && candidate.safetyRatings.length > 0) {
          detailMessage += ` Safety Ratings: ${JSON.stringify(candidate.safetyRatings)}.`;
        }
      } else if (result && result.response && (!result.response.candidates || result.response.candidates.length === 0) ) {
        detailMessage += ' No valid candidates found in response.';
      } else if (result && !result.response) {
        detailMessage += ' No response object in result.';
      } else if (!result) {
        detailMessage += ' Prompt execution result itself is null or undefined.';
      }
      // Return a user-facing error message
      return { aiResponseMessage: `Sorry, I encountered an issue processing your request: ${detailMessage}. Please try again or rephrase.` };
    }
    
    const output = result.output; // Now we know output and output.aiResponseMessage are valid
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
    
    // Log critical inputs that might have caused the error
    console.error('CRITICAL_AI_DEBUG: Inputs that may have caused error: userMessage:', flowInput.userMessage, 'sectionContext:', flowInput.sectionContext);
    // Return a user-facing error message
    return { aiResponseMessage: `Sorry, I encountered an error connecting to the AI assistant: ${errorMessage}` };
  }
}
