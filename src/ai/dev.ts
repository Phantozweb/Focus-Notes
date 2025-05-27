
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-optometry-case.ts';
import '@/ai/flows/extract-case-insights.ts';
import '@/ai/flows/ask-focus-ai-about-case.ts'; // Added new flow
