import { Audio, AVPlaybackStatus } from 'expo-av';
import Constants from 'expo-constants';
import { create } from 'zustand';

interface AudioState {
  isPlaying: boolean;
  audioQueue: string[];
  currentSound: Audio.Sound | null;
  addToQueue: (audioUrl: string) => void;
  clearQueue: () => void;
  stopPlayback: () => Promise<void>;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  audioQueue: [],
  currentSound: null,

  addToQueue: (audioUrl: string) => {
    set((state) => ({
      audioQueue: [...state.audioQueue, audioUrl],
    }));

    // Start playing if not already playing
    if (!get().isPlaying) {
      void playNext();
    }
  },

  clearQueue: () => {
    set({ audioQueue: [] });
  },

  stopPlayback: async () => {
    const { currentSound } = get();
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
    set({
      isPlaying: false,
      currentSound: null,
      audioQueue: [],
    });
  },
}));

async function playNext() {
  const store = useAudioStore.getState();
  
  if (store.audioQueue.length === 0) {
    useAudioStore.setState({
      isPlaying: false,
      currentSound: null,
    });
    return;
  }

  const nextAudioUrl = store.audioQueue[0];
  const remainingQueue = store.audioQueue.slice(1);

  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: nextAudioUrl },
      { shouldPlay: true },
      (status: AVPlaybackStatus) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          void sound.unloadAsync();
          useAudioStore.setState({
            currentSound: null,
            audioQueue: remainingQueue,
          });
          void playNext();
        }
      }
    );

    useAudioStore.setState({
      isPlaying: true,
      currentSound: sound,
      audioQueue: remainingQueue,
    });
  } catch (error) {
    console.error('Error playing audio:', error);
    useAudioStore.setState({
      isPlaying: false,
      currentSound: null,
      audioQueue: remainingQueue,
    });
    void playNext();
  }
}

// Text-to-speech service using ElevenLabs
const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.elevenLabsApiKey as string;
const VOICE_ID = 'your-voice-id'; // Replace with your chosen voice ID

interface ElevenLabsResponse extends Blob {
  type: string;
}

export async function generateSpeech(text: string): Promise<string> {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    const blob = await response.blob() as ElevenLabsResponse;
    
    // In React Native, we need to handle the blob differently
    // We'll store it in a temporary file and return the file URI
    const fileUri = `${Constants.expoConfig?.extra?.tempAudioDir}/${Date.now()}.mp3`;
    // TODO: Implement file storage logic here
    return fileUri;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw error;
  }
} 