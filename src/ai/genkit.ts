import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({apiKey: 'AIzaSyBwlyo5Mml52n8RriwaFRnimEJF1XgF0j4'})],
  model: 'googleai/gemini-2.5-pro',
});