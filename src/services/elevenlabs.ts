const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default sports announcer voice

interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function textToSpeech({
  text,
  voiceId = ELEVENLABS_VOICE_ID,
  stability = 0.5,
  similarityBoost = 0.75,
}: TextToSpeechOptions): Promise<string> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
}

export async function convertPlayToSpeech(playText: string): Promise<string> {
  // Add sports announcer flair to the play text
  const enhancedText = `And here's the play: ${playText}`;
  return textToSpeech({ text: enhancedText });
} 