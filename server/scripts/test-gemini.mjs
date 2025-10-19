import '../node_modules/dotenv/config.js';
import { chatWithAssistant } from '../src/services/mattersAssistantService.js';

const body = {
  messages: [
    { role: 'user', content: 'Hello, can you suggest structural ideas for a two-story house?' }
  ],
};

chatWithAssistant(body)
  .then((response) => {
    console.log('Gemini reply:', response);
  })
  .catch((error) => {
    console.error('Gemini error:', error);
  });
