const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Configuration type for voice settings
export type VoiceSettings = {
	stability: number;
	similarity_boost: number;
};

// Default voice settings
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
	stability: 0.5,
	similarity_boost: 0.5,
};

// Error class for ElevenLabs API errors
export class ElevenLabsError extends Error {
	constructor(message: string, public statusCode?: number) {
		super(message);
		this.name = 'ElevenLabsError';
	}
}

export class ElevenLabsApi {
	private apiKey: string;
	private voiceId: string;
	private modelId: string;

	constructor(apiKey: string, voiceId: string, modelId = 'eleven_monolingual_v1') {
		this.apiKey = apiKey;
		this.voiceId = voiceId;
		this.modelId = modelId;
	}

	// Convert text to speech and return audio buffer
	async textToSpeech(
		text: string,
		voiceSettings: VoiceSettings = DEFAULT_VOICE_SETTINGS
	): Promise<ArrayBuffer> {
		const response = await fetch(
			`${ELEVENLABS_API_BASE}/text-to-speech/${this.voiceId}`,
			{
				method: 'POST',
				headers: {
					'Accept': 'audio/mpeg',
					'Content-Type': 'application/json',
					'xi-api-key': this.apiKey,
				},
				body: JSON.stringify({
					text,
					model_id: this.modelId,
					voice_settings: {
						stability: voiceSettings.stability,
						similarity_boost: voiceSettings.similarity_boost,
					},
				}),
			}
		);

		if (!response.ok) {
			let errorMessage = `Failed to convert text to speech: ${response.statusText}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.detail || errorMessage;
			} catch {
				// Ignore JSON parsing error
			}
			throw new ElevenLabsError(errorMessage, response.status);
		}

		return await response.arrayBuffer();
	}

	// Get available voices
	async getVoices() {
		const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
			headers: {
				'Accept': 'application/json',
				'xi-api-key': this.apiKey,
			},
		});

		if (!response.ok) {
			throw new ElevenLabsError(`Failed to get voices: ${response.statusText}`, response.status);
		}

		return await response.json();
	}

	// Get user subscription info
	async getUserInfo() {
		const response = await fetch(`${ELEVENLABS_API_BASE}/user`, {
			headers: {
				'Accept': 'application/json',
				'xi-api-key': this.apiKey,
			},
		});

		if (!response.ok) {
			throw new ElevenLabsError(`Failed to get user info: ${response.statusText}`, response.status);
		}

		return await response.json();
	}

	// Get remaining character count
	async getRemainingCharacters() {
		const userInfo = await this.getUserInfo();
		return userInfo.character_count;
	}
}

// Create and export a singleton instance
let elevenLabsApi: ElevenLabsApi | null = null;

export const initializeElevenLabs = (apiKey: string, voiceId: string) => {
	elevenLabsApi = new ElevenLabsApi(apiKey, voiceId);
	return elevenLabsApi;
};

export const getElevenLabsApi = () => {
	if (!elevenLabsApi) {
		throw new Error('ElevenLabs API not initialized. Call initializeElevenLabs first.');
	}
	return elevenLabsApi;
}; 