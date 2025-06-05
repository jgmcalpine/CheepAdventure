import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Audio } from 'expo-av';

interface AudioContextType {
  isPlaying: boolean;
  currentGameId: string | null;
  audioQueue: string[];
  addToQueue: (audioUrl: string) => void;
  startListening: (gameId: string) => void;
  stopListening: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup audio when component unmounts
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const playNext = async () => {
    if (audioQueue.length === 0) {
      setIsPlaying(false);
      return;
    }

    const nextAudioUrl = audioQueue[0];
    const remainingQueue = audioQueue.slice(1);
    setAudioQueue(remainingQueue);

    try {
      if (currentSound) {
        await currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: nextAudioUrl },
        { shouldPlay: true }
      );

      setCurrentSound(sound);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          playNext();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      playNext(); // Skip to next audio on error
    }
  };

  const addToQueue = (audioUrl: string) => {
    setAudioQueue((prev) => [...prev, audioUrl]);
    if (!isPlaying) {
      setIsPlaying(true);
      playNext();
    }
  };

  const startListening = async (gameId: string) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      setCurrentGameId(gameId);
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  };

  const stopListening = async () => {
    if (currentSound) {
      await currentSound.unloadAsync();
    }
    setCurrentGameId(null);
    setAudioQueue([]);
    setIsPlaying(false);
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        currentGameId,
        audioQueue,
        addToQueue,
        startListening,
        stopListening,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 