
'use server';
/**
 * @fileOverview AI flow for taking raw, unstructured text and structuring it into EMR data.
 *
 * - structureEmrData - Takes raw text and maps it to structured EMR fields.
 * - StructureEmrDataInput - The input type (raw text).
 * - StructureEmrDataOutput - The output type (JSON string of EMR data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { StructureEmrDataInput, StructureEmrDataOutput } from '@/types/case';

const StructureEmrDataInputSchema = z.object({
  rawText: z.string().describe("Raw unstructured text copied from a document, typed by the user, or extracted via OCR."),
});

const StructureEmrDataOutputSchema = z.object({
  extractedDataJson: z.string().describe("A JSON string representing an object where keys are EMR form field names and values are the extracted data. Example: '{\"name\": \"John Doe\", \"age\": 45}'.")
});

const prompt = ai.definePrompt({
  name: 'structureEmrDataPrompt',
  input: { schema: StructureEmrDataInputSchema },
  output: { schema: StructureEmrDataOutputSchema },
  model: 'googleai/gemini-2.5-pro',
  prompt: `You are an expert AI assistant specializing in data extraction for optometry electronic medical records (EMR). Your task is to analyze a block of raw text, extract all relevant clinical information, and structure it into a specific JSON format.

  **Instructions:**

  1.  **Analyze the Input**: Carefully examine the provided raw text from the case document.
  2.  **Map to EMR Fields**: Map the extracted information to the corresponding EMR field names listed below. Be precise. If a value for a field is not present, omit the key from the final JSON.
  3.  **Format Correctly**:
      *   For radio buttons or dropdowns with specific values (like 'sex', 'posting'), use the exact string value.
      *   For checkboxes (like 'subjRefractionChecksOD'), create an array of strings.
      *   For dates, attempt to parse them into a "YYYY-MM-DD" format. If not possible, use the extracted string.
  4.  **Return JSON String**: Your final output MUST be a single, valid JSON string in the 'extractedDataJson' field.

  **Known EMR Field Names:**
  "posting", "mrdNo", "dateOfVisit", "name", "age", "sex", "chiefComplaint", "pastOcularHistory", "currentMedications", "pastMedicalHistory", "recentInvestigations", "familyHistory", "birthHistory", "allergies", "distanceUnaidedOD", "distanceUnaidedOS", "distancePinholeOD", "distancePinholeOS", "distanceOldGlassesOD", "distanceOldGlassesOS", "nearUnaidedOD", "nearUnaidedOS", "nearPinholeOD", "nearPinholeOS", "nearOldGlassesOD", "nearOldGlassesOS", "pgpSphOD", "pgpCylOD", "pgpAxisOD", "pgpSphOS", "pgpCylOS", "pgpAxisOS", "autoRefractionOD", "autoRefractionOS", "objRefractionOD", "objRefractionOS", "objRefractionFindingsOD", "objRefractionFindingsOS", "subjRefractionOD", "subjRefractionOS", "subjRefractionChecksOD", "subjRefractionChecksOS", "finalAcuityOD", "finalAcuityOS", "finalCorrectionPreference", "lensType", "prismDioptersOD", "prismBaseOD", "prismDioptersOS", "prismBaseOS", "keratometryVerticalOD", "keratometryHorizontalOD", "keratometryVerticalOS", "keratometryHorizontalOS", "keratometryComments", "coverTest", "eom", "npcSubj", "npcObj", "npaOD", "npaOS", "npaOU", "wfdtDistance", "wfdtNear", "stereopsis", "pupillaryEvaluation", "externalExamination", "lidsLashesOD", "lidsLashesOS", "conjunctivaScleraOD", "conjunctivaScleraOS", "corneaOD", "corneaOS", "anteriorChamberOD", "anteriorChamberOS", "irisOD", "irisOS", "lensOD", "lensOS", "tonometryPressureOD", "tonometryPressureOS", "tonometryMethod", "tonometryTime", "tbutOD", "tbutOS", "schirmerOD", "schirmerOS", "vitreousOD", "vitreousOS", "opticDiscOD", "opticDiscOS", "cupDiscRatioOD", "cupDiscRatioOS", "maculaOD", "maculaOS", "vesselsOD", "vesselsOS", "peripheryOD", "peripheryOS", "diagnosis", "interventionPlanned", "learning"

  **User Input to Process:**
  Raw text from case document: {{{rawText}}}
  
  Analyze the input and provide the structured JSON string now.
  `
});

export async function structureEmrData(input: StructureEmrDataInput): Promise<StructureEmrDataOutput> {
  console.log("AI FLOW: Starting EMR data structuring (Step 2)...");
  
  const result = await prompt(input);
  const output = result.output;

  if (!output || !output.extractedDataJson) {
    console.error("AI FLOW ERROR: The AI model did not return the expected structured JSON output.", result);
    throw new Error("Failed to structure data for the EMR. The AI model returned an invalid response.");
  }

  try {
    // Validate that the output is a parseable JSON object
    JSON.parse(output.extractedDataJson);
  } catch (e) {
    console.error("AI FLOW ERROR: The model returned a string that is not valid JSON.", output.extractedDataJson);
    throw new Error("Failed to parse the structured data. The AI returned a malformed JSON string.");
  }
  
  console.log("AI FLOW: EMR data structuring successful (Step 2).");
  return output;
}
