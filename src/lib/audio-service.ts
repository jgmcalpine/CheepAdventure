import { Audio, AVPlaybackStatus } from 'expo-av';
import { getElevenLabsApi } from './elevenlabs-api';
import { supabase } from './supabase';
import type { Play } from './supabase';

export class AudioService {
	private audioQueue: Play[] = [];
	private isPlaying = false;
	private currentSound: Audio.Sound | null = null;
	private onPlayComplete?: () => void;

	constructor(onPlayComplete?: () => void) {
		this.onPlayComplete = onPlayComplete;
	}

	// Add a play to the queue
	async addToQueue(play: Play) {
		this.audioQueue.push(play);
		if (!this.isPlaying) {
			await this.playNext();
		}
	}

	// Add multiple plays to the queue
	async addMultipleToQueue(plays: Play[]) {
		this.audioQueue.push(...plays);
		if (!this.isPlaying) {
			await this.playNext();
		}
	}

	// Clear the queue and stop playback
	async clear() {
		this.audioQueue = [];
		await this.stop();
	}

	// Stop current playback
	async stop() {
		if (this.currentSound) {
			await this.currentSound.stopAsync();
			await this.currentSound.unloadAsync();
			this.currentSound = null;
		}
		this.isPlaying = false;
	}

	// Pause current playback
	async pause() {
		if (this.currentSound) {
			await this.currentSound.pauseAsync();
			this.isPlaying = false;
		}
	}

	// Resume playback
	async resume() {
		if (this.currentSound) {
			await this.currentSound.playAsync();
			this.isPlaying = true;
		}
	}

	// Generate audio for a play if it doesn't exist
	private async ensureAudioExists(play: Play): Promise<string> {
		if (play.audio_url) {
			return play.audio_url;
		}

		// Generate audio using ElevenLabs
		const elevenlabs = getElevenLabsApi();
		const audioBuffer = await elevenlabs.textToSpeech(play.description);

		// Upload to Supabase Storage
		const fileName = `plays/${play.id}.mp3`;
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from('audio-files')
			.upload(fileName, audioBuffer, {
				contentType: 'audio/mpeg',
			});

		if (uploadError) {
			throw new Error(`Failed to upload audio: ${uploadError.message}`);
		}

		// Get public URL
		const { data: urlData } = supabase.storage
			.from('audio-files')
			.getPublicUrl(fileName);

		// Update play with audio URL
		const { error: updateError } = await supabase
			.from('plays')
			.update({
				audio_url: urlData.publicUrl,
				audio_generated_at: new Date().toISOString(),
			})
			.eq('id', play.id);

		if (updateError) {
			throw new Error(`Failed to update play: ${updateError.message}`);
		}

		return urlData.publicUrl;
	}

	// Play the next item in the queue
	private async playNext() {
		if (this.audioQueue.length === 0) {
			this.isPlaying = false;
			this.onPlayComplete?.();
			return;
		}

		this.isPlaying = true;
		const play = this.audioQueue.shift()!;

		try {
			// Ensure we have audio for this play
			const audioUrl = await this.ensureAudioExists(play);

			// Load and play the audio
			const { sound } = await Audio.Sound.createAsync(
				{ uri: audioUrl },
				{ shouldPlay: true },
				this.onPlaybackStatusUpdate
			);

			this.currentSound = sound;
		} catch (error) {
			console.error('Failed to play audio:', error);
			// Skip to next play on error
			await this.playNext();
		}
	}

	// Handle playback status updates
	private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
		if (!status.isLoaded) {
			// Handle error
			if (status.error) {
				console.error('Playback error:', status.error);
			}
			return;
		}

		if (status.didJustFinish) {
			// Clean up current sound
			if (this.currentSound) {
				this.currentSound.unloadAsync();
				this.currentSound = null;
			}

			// Play next in queue
			this.playNext();
		}
	};
}

// Create and export a singleton instance
let audioService: AudioService | null = null;

export const initializeAudioService = (onPlayComplete?: () => void) => {
	audioService = new AudioService(onPlayComplete);
	return audioService;
};

export const getAudioService = () => {
	if (!audioService) {
		throw new Error('Audio service not initialized. Call initializeAudioService first.');
	}
	return audioService;
}; 