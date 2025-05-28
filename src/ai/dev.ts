
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-optometry-case.ts';
import '@/ai/flows/extract-case-insights.ts';
import '@/ai/flows/chat-with-case-flow.ts'; // Added new chat flow
