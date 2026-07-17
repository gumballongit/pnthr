import { ELEVENLABS_API_KEY } from '../constants.ts';
import { Voice } from '../types.ts';

const BASE_URL = 'https://api.elevenlabs.io/v1';

export const fetchVoices = async (): Promise<Voice[]> => {
  try {
    const response = await fetch(`${BASE_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
};

export const generateSpeech = async (text: string, voiceId: string): Promise<Blob> => {
  const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to generate speech: ${response.statusText} - ${errText}`);
  }

  return await response.blob();
};
