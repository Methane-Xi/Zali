import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectVerseFromSpeech(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following transcribed speech from a church service. 
If the speaker is quoting or referencing a Bible verse, extract the reference and the text of the verse.
Also, analyze the mood and context of the speech to suggest visual presentation settings.
If no verse is detected, still return the mood and context analysis.

Speech: "${text}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: {
              type: Type.BOOLEAN,
              description: 'Whether a Bible verse was detected.'
            },
            reference: {
              type: Type.STRING,
              description: 'The scripture reference (e.g., John 3:16). Empty if none.'
            },
            text: {
              type: Type.STRING,
              description: 'The text of the verse. Empty if none.'
            },
            context: {
              type: Type.STRING,
              description: 'The general topic or sermon point (e.g., Hope, Forgiveness, Faith).'
            },
            mood: {
              type: Type.STRING,
              description: 'The emotional tone (e.g., celebratory, reflective, calm, urgent).'
            },
            suggestedBackground: {
              type: Type.STRING,
              description: 'A suggested tailwind gradient class based on the mood (e.g., bg-gradient-to-br from-blue-900 to-gray-900).'
            },
            suggestedAnimation: {
              type: Type.STRING,
              description: 'A suggested animation style (e.g., fade, slide-up, zoom-in).'
            }
          },
          required: ['detected', 'context', 'mood', 'suggestedBackground', 'suggestedAnimation']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error('Error detecting verse:', error);
    return null;
  }
}
