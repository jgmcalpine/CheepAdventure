import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { supabase } from './supabase';

class AudioService {
	private audioQueue: string[] = [];
	private isPlaying: boolean = false;
	private currentSound: Audio.Sound | null = null;

	async addToQueue(playId: string, description: string) {
		try {
			// Check if audio already exists
			const { data: play } = await supabase
				.from('plays')
				.select('audio_url')
				.eq('id', playId)
				.single();

			if (play?.audio_url) {
				this.audioQueue.push(play.audio_url);
				if (!this.isPlaying) {
					await this.playNext();
				}
				return;
			}

			// Generate new audio
			const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID', {
				method: 'POST',
				headers: {
					'Accept': 'audio/mpeg',
					'Content-Type': 'application/json',
					'xi-api-key': Constants.expoConfig?.extra?.elevenLabsApiKey ?? '',
				},
				body: JSON.stringify({
					text: description,
					model_id: 'eleven_monolingual_v1',
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.5,
					},
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to generate audio');
			}

			const audioBlob = await response.blob();
			const formData = new FormData();
			formData.append('file', audioBlob);

			// Upload to Supabase Storage
			const fileName = `plays/${playId}.mp3`;
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('audio-files')
				.upload(fileName, audioBlob, {
					contentType: 'audio/mpeg',
				});

			if (uploadError) {
				throw uploadError;
			}

			// Get public URL
			const { data: urlData } = await supabase.storage
				.from('audio-files')
				.getPublicUrl(fileName);

			// Update play with audio URL
			await supabase
				.from('plays')
				.update({
					audio_url: urlData.publicUrl,
					audio_generated_at: new Date().toISOString(),
				})
				.eq('id', playId);

			this.audioQueue.push(urlData.publicUrl);
			if (!this.isPlaying) {
				await this.playNext();
			}
		} catch (error) {
			console.error('Error in addToQueue:', error);
			throw error;
		}
	}

	private async playNext() {
		if (this.audioQueue.length === 0) {
			this.isPlaying = false;
			return;
		}

		this.isPlaying = true;
		const audioUrl = this.audioQueue.shift()!;

		try {
			if (this.currentSound) {
				await this.currentSound.unloadAsync();
			}

			const { sound } = await Audio.Sound.createAsync(
				{ uri: audioUrl },
				{ shouldPlay: true }
			);

			this.currentSound = sound;

			sound.setOnPlaybackStatusUpdate(async (status) => {
				if (status.isLoaded && status.didJustFinish) {
					await sound.unloadAsync();
					this.currentSound = null;
					await this.playNext();
				}
			});
		} catch (error) {
			console.error('Error playing audio:', error);
			await this.playNext(); // Skip to next audio on error
		}
	}

	async stopAll() {
		this.audioQueue = [];
		if (this.currentSound) {
			await this.currentSound.unloadAsync();
			this.currentSound = null;
		}
		this.isPlaying = false;
	}
}

export const audioService = new AudioService(); 