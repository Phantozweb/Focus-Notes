
'use server';
/**
 * @fileOverview AI flow for converting a physical case sheet image to structured EMR data.
 *
 * - convertSheetToEmr - Extracts text from an image and maps it to EMR fields.
 * - ConvertSheetToEmrInput - The input type (image data).
 * - ConvertSheetToEmrOutput - The output type (JSON string of EMR data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export type ConvertSheetToEmrInput = z.infer<typeof ConvertSheetToEmrInputSchema>;
const ConvertSheetToEmrInputSchema = z.object({
  imageDataUri: z.string().describe("A photo of the case sheet as a data URI ('data:<mimetype>;base64,<data>')."),
});

export type ConvertSheetToEmrOutput = z.infer<typeof ConvertSheetToEmrOutputSchema>;
const ConvertSheetToEmrOutputSchema = z.object({
  extractedDataJson: z.string().describe("A JSON string representing an object where keys are EMR form field names and values are the extracted data. Example: '{\"name\": \"John Doe\", \"age\": 45}'.")
});

const prompt = ai.definePrompt({
  name: 'convertSheetToEmrPrompt',
  input: { schema: ConvertSheetToEmrInputSchema },
  output: { schema: ConvertSheetToEmrOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest', // Use a model with strong vision capabilities
  system: `You are an expert AI assistant specializing in Optical Character Recognition (OCR) and data extraction for optometry electronic medical records (EMR). Your task is to analyze an image of a physical case sheet, extract all relevant clinical information, and structure it into a specific JSON format.

  **Instructions:**

  1.  **Analyze the Image**: Carefully examine the provided image of the optometry case sheet.
  2.  **Extract Text**: Perform OCR to extract all handwritten and printed text from the sheet.
  3.  **Map to EMR Fields**: Map the extracted information to the corresponding EMR field names listed below. Be precise. If a value for a field is not present, omit the key from the final JSON.
  4.  **Format Correctly**:
      *   For radio buttons or dropdowns with specific values (like 'sex', 'posting'), use the exact string value.
      *   For checkboxes (like 'subjRefractionChecksOD'), create an array of strings.
      *   For dates, attempt to parse them into a "YYYY-MM-DD" format. If not possible, use the extracted string.
  5.  **Return JSON String**: Your final output MUST be a single, valid JSON string in the 'extractedDataJson' field.

  **Known EMR Field Names:**
  "posting", "mrdNo", "dateOfVisit", "name", "age", "sex", "chiefComplaint", "pastOcularHistory", "currentMedications", "pastMedicalHistory", "recentInvestigations", "familyHistory", "birthHistory", "allergies", "distanceUnaidedOD", "distanceUnaidedOS", "distancePinholeOD", "distancePinholeOS", "distanceOldGlassesOD", "distanceOldGlassesOS", "nearUnaidedOD", "nearUnaidedOS", "nearPinholeOD", "nearPinholeOS", "nearOldGlassesOD", "nearOldGlassesOS", "pgpSphOD", "pgpCylOD", "pgpAxisOD", "pgpSphOS", "pgpCylOS", "pgpAxisOS", "autoRefractionOD", "autoRefractionOS", "objRefractionOD", "objRefractionOS", "objRefractionFindingsOD", "objRefractionFindingsOS", "subjRefractionOD", "subjRefractionOS", "subjRefractionChecksOD", "subjRefractionChecksOS", "finalAcuityOD", "finalAcuityOS", "finalCorrectionPreference", "lensType", "prismDioptersOD", "prismBaseOD", "prismDioptersOS", "prismBaseOS", "keratometryVerticalOD", "keratometryHorizontalOD", "keratometryVerticalOS", "keratometryHorizontalOS", "keratometryComments", "coverTest", "eom", "npcSubj", "npcObj", "npaOD", "npaOS", "npaOU", "wfdtDistance", "wfdtNear", "stereopsis", "pupillaryEvaluation", "externalExamination", "lidsLashesOD", "lidsLashesOS", "conjunctivaScleraOD", "conjunctivaScleraOS", "corneaOD", "corneaOS", "anteriorChamberOD", "anteriorChamberOS", "irisOD", "irisOS", "lensOD", "lensOS", "tonometryPressureOD", "tonometryPressureOS", "tonometryMethod", "tonometryTime", "tbutOD", "tbutOS", "schirmerOD", "schirmerOS", "vitreousOD", "vitreousOS", "opticDiscOD", "opticDiscOS", "cupDiscRatioOD", "cupDiscRatioOS", "maculaOD", "maculaOS", "vesselsOD", "vesselsOS", "peripheryOD", "peripheryOS", "diagnosis", "interventionPlanned", "learning"

  Analyze the image and provide the structured JSON string now.
  `,
  prompt: `Image of the case sheet: {{media url=imageDataUri}}`
});

export async function convertSheetToEmr(input: ConvertSheetToEmrInput): Promise<ConvertSheetToEmrOutput> {
  console.log("AI FLOW: Starting EMR sheet conversion for image...");
  
  const result = await prompt(input);
  const output = result.output;

  if (!output || !output.extractedDataJson) {
    console.error("AI FLOW ERROR: The AI model did not return the expected JSON output.", result);
    throw new Error("Failed to extract data from the sheet. The AI model returned an invalid response.");
  }

  try {
    // Validate that the output is a parseable JSON object
    JSON.parse(output.extractedDataJson);
  } catch (e) {
    console.error("AI FLOW ERROR: The model returned a string that is not valid JSON.", output.extractedDataJson);
    throw new Error("Failed to parse the extracted data. The AI returned a malformed structure.");
  }
  
  console.log("AI FLOW: EMR sheet conversion successful.");
  return output;
}
