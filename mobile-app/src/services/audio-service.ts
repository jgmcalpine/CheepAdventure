import { Audio } from 'expo-av';

interface QueuedAudio {
  url: string;
  onComplete?: () => void;
}

class AudioService {
  private audioQueue: QueuedAudio[] = [];
  private isPlaying: boolean = false;
  private currentSound: Audio.Sound | null = null;

  async addToQueue(url: string, onComplete?: () => void) {
    this.audioQueue.push({ url, onComplete });
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  async clearQueue() {
    this.audioQueue = [];
    if (this.currentSound) {
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
    this.isPlaying = false;
  }

  private async playNext() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const { url, onComplete } = this.audioQueue.shift()!;

    try {
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      this.currentSound = sound;

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          this.currentSound = null;
          onComplete?.();
          await this.playNext();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      // Skip to next audio in case of error
      await this.playNext();
    }
  }

  async stop() {
    if (this.currentSound) {
      await this.currentSound.stopAsync();
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  async pause() {
    if (this.currentSound) {
      await this.currentSound.pauseAsync();
    }
  }

  async resume() {
    if (this.currentSound) {
      await this.currentSound.playAsync();
    }
  }
}

export const audioService = new AudioService(); 