import env from '../config/env';

interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

class TTSService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId: string = 'ErXwobaYiN019PkySvjV'; // Josh voice
  private defaultOptions: TTSOptions = {
    stability: 0.5,
    similarityBoost: 0.5,
  };

  constructor() {
    this.apiKey = env.ELEVENLABS_API_KEY;
  }

  async generateSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<ArrayBuffer> {
    const voiceId = options.voiceId || this.defaultVoiceId;
    const stability = options.stability ?? this.defaultOptions.stability;
    const similarityBoost = options.similarityBoost ?? this.defaultOptions.similarityBoost;

    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async generateAndCacheAudio(
    text: string,
    cacheKey: string,
    options?: TTSOptions
  ): Promise<string> {
    // This method would be implemented to:
    // 1. Check if audio exists in Supabase storage
    // 2. If not, generate audio and upload to Supabase
    // 3. Return the public URL
    // Implementation will be added when Supabase storage is set up
    throw new Error('Not implemented');
  }
}

export const ttsService = new TTSService(); 