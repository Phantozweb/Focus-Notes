import 'dotenv/config';
import '@/ai/flows/analyze-optometry-case.ts';
import '@/ai/flows/extract-case-insights.ts';
import '@/ai/flows/chat-with-case-flow.ts';
import '@/ai/flows/interactive-emr-assistant.ts'; // Added new EMR assistant flow
import '@/ai/flows/convert-sheet-to-emr.ts'; // Added new sheet conversion flow
import '@/ai/flows/structure-emr-data.ts'; // New flow for structuring data
import '@/ai/flows/format-case-sheet.ts'; // New flow for formatting sheet
