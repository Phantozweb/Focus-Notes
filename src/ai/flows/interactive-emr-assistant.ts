
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
// Reusing GenkitChatMessage from full case types for consistency
import type { GenkitChatMessage } from '@/types/case'; 

export type InteractiveEmrAssistantInput = z.infer<typeof InteractiveEmrAssistantInputSchema>;
const InteractiveEmrAssistantInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on (e.g., 'Patient Info', 'Chief Complaint')."),
  userMessage: z.string().describe("The user's latest message or response to the AI."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe('The history of the conversation with the EMR assistant so far.'),
});

const EmrAssistantMainPromptInputSchema = z.object({
  sectionContext: z.string().describe("The current EMR section the user is focused on."),
  formSnapshot: z.record(z.string(), z.any()).optional().describe("A snapshot of the current data already in the EMR form."),
  currentUserMessage: z.string().describe("The user's current message to be processed."),
});

export type InteractiveEmrAssistantOutput = z.infer<typeof InteractiveEmrAssistantOutputSchema>;
const InteractiveEmrAssistantOutputSchema = z.object({
  fieldsToUpdateJson: z.string().optional().describe("A JSON string representing an object where keys are EMR form field names and values are the data to update. Example: '{\"name\": \"John Doe\", \"age\": 45}'. If no fields need updating, this can be omitted or be an empty JSON object string like '{}'."),
  aiResponseMessage: z.string().describe("AI's next message to the user."),
});

// Expanded list of known EMR fields
const KNOWN_EMR_FIELDS = [
  // Patient & Visit Info
  "posting", "mrdNo", "dateOfVisit", "name", "age", "sex",
  // History
  "chiefComplaint", "pastOcularHistory", "currentMedications", "pastMedicalHistory", "recentInvestigations", "familyHistory", "birthHistory", "allergies",
  // Visual Acuity
  "distanceUnaidedOD", "distanceUnaidedOS", "distancePinholeOD", "distancePinholeOS", "distanceOldGlassesOD", "distanceOldGlassesOS",
  "nearUnaidedOD", "nearUnaidedOS", "nearPinholeOD", "nearPinholeOS", "nearOldGlassesOD", "nearOldGlassesOS",
  // Refraction - PGP
  "pgpSphOD", "pgpCylOD", "pgpAxisOD", "pgpSphOS", "pgpCylOS", "pgpAxisOS",
  // Auto Refractor
  "autoRefractionOD", "autoRefractionOS",
  // Refraction - Objective
  "objRefractionOD", "objRefractionOS", "objRefractionFindingsOD", "objRefractionFindingsOS",
  // Refraction - Subjective
  "subjRefractionOD", "subjRefractionOS", "subjRefractionChecksOD", "subjRefractionChecksOS",
  // Final Correction
  "finalAcuityOD", "finalAcuityOS", "finalCorrectionPreference", "lensType", "prismDioptersOD", "prismBaseOD", "prismDioptersOS", "prismBaseOS",
  // Ancillary Ocular Tests
  "keratometryVerticalOD", "keratometryHorizontalOD", "keratometryVerticalOS", "keratometryHorizontalOS", "keratometryComments",
  "coverTest", "eom", "npcSubj", "npcObj", "npaOD", "npaOS", "npaOU", "wfdtDistance", "wfdtNear", "stereopsis",
  // Slit Lamp & Anterior Segment
  "pupillaryEvaluation", "externalExamination", "lidsLashesOD", "lidsLashesOS", "conjunctivaScleraOD", "conjunctivaScleraOS",
  "corneaOD", "corneaOS", "anteriorChamberOD", "anteriorChamberOS", "irisOD", "irisOS", "lensOD", "lensOS",
  // Tonometry & Dry Eye
  "tonometryPressureOD", "tonometryPressureOS", "tonometryMethod", "tonometryTime", "tbutOD", "tbutOS", "schirmerOD", "schirmerOS",
  // Posterior Segment
  "vitreousOD", "vitreousOS", "opticDiscOD", "opticDiscOS", "cupDiscRatioOD", "cupDiscRatioOS",
  "maculaOD", "maculaOS", "vesselsOD", "vesselsOS", "peripheryOD", "peripheryOS",
  // Final Plan
  "diagnosis", "interventionPlanned", "learning"
].join(', ');

const systemInstructionTemplate = `You are Focus AI, an intelligent EMR assistant for optometry. Your role is to help the user efficiently fill out an optometry case record by asking guiding questions and extracting information from their responses to populate form fields. Maintain a professional and helpful tone.

Current EMR Section in Focus: {{{sectionContext}}}

Available EMR fields: ${KNOWN_EMR_FIELDS}

{{#if formSnapshot}}
Current Form Data Snapshot (Review this to avoid asking for info already provided):
{{#each formSnapshot}}
- {{ @key }}: {{this}}
{{/each}}
{{else}}
The form is currently empty.
{{/if}}

Your Task, based on the user's message below:
1.  Analyze the user's message in the context of the EMR section: "{{{sectionContext}}}".
2.  If the user's message provides information that can directly fill one or more EMR form fields relevant to this section, identify those fields and their values.
3.  Populate the 'fieldsToUpdateJson' field with a JSON STRING. This string should represent an object where keys EXACTLY MATCH the EMR form field names (e.g., "name", "age", "chiefComplaint", "diagnosis") and values are the data to update. Example: '{"name": "John Doe", "age": 45, "sex": "Male"}'.
4.  For fields expecting an array (like objRefractionFindingsOD), the value should be an array of strings. Example: '{"objRefractionFindingsOD": ["Dull Glow", "Central Opacity"]}'.
5.  Formulate an 'aiResponseMessage'. This message should:
    - If data was extracted: Confirm the update (e.g., "Okay, I've noted the name as 'John Doe'.") and then ask a relevant, specific follow-up question for the current section.
    - If no data was extracted: Ask a clear, guiding question to help the user provide the next piece of information for "{{{sectionContext}}}".
    - Be conversational and helpful. Prioritize asking about required fields (like 'name' or 'chiefComplaint') before optional ones.
6.  If the user asks a question, answer it concisely or guide them back to data entry.

IMPORTANT:
- Stick to the current EMR section: "{{{sectionContext}}}".
- Ensure keys in the JSON string for 'fieldsToUpdateJson' are valid EMR field names.
- Do not invent data.

Process the user's message now.
`;

const emrAssistantPrompt = ai.definePrompt(
  {
    name: 'interactiveEmrAssistantPrompt',
    input: { schema: EmrAssistantMainPromptInputSchema },
    output: { schema: InteractiveEmrAssistantOutputSchema },
    system: systemInstructionTemplate,
    prompt: `{{{currentUserMessage}}}`,
    model: 'googleai/gemini-2.0-flash', 
    config: {
      temperature: 0.3, 
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
    const result = await emrAssistantPrompt(mainPromptData, { history: flowInput.chatHistory });
    
    if (!result || !result.output || typeof result.output.aiResponseMessage !== 'string') { 
      console.error('CRITICAL_AI_DEBUG: interactiveEmrAssistantPrompt did not return a valid output structure. Full result:', JSON.stringify(result, null, 2));
      let detailMessage = 'AI assistant prompt did not return the expected output structure (missing or invalid aiResponseMessage).';
      const candidate = result?.response?.candidates?.[0];
      if (candidate) {
        detailMessage += ` Finish Reason: ${candidate.finishReason || 'N/A'}.`;
        if (candidate.safetyRatings && candidate.safetyRatings.length > 0) {
          detailMessage += ` Safety Ratings: ${JSON.stringify(candidate.safetyRatings)}.`;
        }
      }
      return { aiResponseMessage: `Sorry, I encountered an issue processing your request: ${detailMessage}. Please try again or rephrase.`, fieldsToUpdateJson: '{}' };
    }
    
    const output = result.output;
    console.log("CRITICAL_AI_DEBUG: AI Assistant Output: ", JSON.stringify(output, null, 2));
    return output;

  } catch (e: any) {
    console.error('CRITICAL_AI_DEBUG: Error during interactiveEmrAssistantPrompt execution:', e);
    let errorMessage = e.message || 'Unknown error during AI processing.';
    return { aiResponseMessage: `Sorry, I encountered an error connecting to the AI assistant: ${errorMessage}`, fieldsToUpdateJson: '{}' };
  }
}
