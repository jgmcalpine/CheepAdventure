import { Audio } from 'expo-av';
import { useAudioStore, generateSpeech } from '../audio';
import { errorHandler } from '../error-handler';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock error handler
jest.mock('../error-handler', () => ({
  errorHandler: {
    handleError: jest.fn(),
  },
}));

describe('AudioService', () => {
  let store: ReturnType<typeof useAudioStore.getState>;
  let mockSound: {
    playAsync: jest.Mock;
    unloadAsync: jest.Mock;
    stopAsync: jest.Mock;
    setOnPlaybackStatusUpdate: jest.Mock;
  };

  beforeEach(() => {
    // Reset store to initial state
    store = useAudioStore.getState();
    store.clearQueue();

    // Create mock sound object
    mockSound = {
      playAsync: jest.fn(),
      unloadAsync: jest.fn(),
      stopAsync: jest.fn(),
      setOnPlaybackStatusUpdate: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
    (Audio.Sound.createAsync as jest.Mock).mockReset();
  });

  describe('addToQueue', () => {
    it('should add audio URL to queue', () => {
      store.addToQueue('test-audio-1.mp3');
      expect(store.audioQueue).toContain('test-audio-1.mp3');
    });

    it('should start playing when adding to empty queue', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({
        sound: mockSound,
      });

      await store.addToQueue('test-audio-1.mp3');

      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: 'test-audio-1.mp3' },
        { shouldPlay: true },
        expect.any(Function)
      );
      expect(store.isPlaying).toBe(true);
    });

    it('should queue multiple audio files', async () => {
      await store.addToQueue('test-audio-1.mp3');
      await store.addToQueue('test-audio-2.mp3');
      await store.addToQueue('test-audio-3.mp3');

      expect(store.audioQueue).toHaveLength(2); // One playing, two in queue
    });
  });

  describe('playback', () => {
    it('should play next audio when current one finishes', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockImplementation(
        async (source, options, callback) => {
          const sound = mockSound;
          callback({ isLoaded: true, didJustFinish: true });
          return { sound };
        }
      );

      await store.addToQueue('test-audio-1.mp3');
      await store.addToQueue('test-audio-2.mp3');

      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(2);
      expect(mockSound.unloadAsync).toHaveBeenCalled();
    });

    it('should handle playback errors gracefully', async () => {
      const error = new Error('Playback error');
      (Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(error);

      await store.addToQueue('test-audio-1.mp3');

      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          audioUrl: 'test-audio-1.mp3',
        })
      );
      expect(store.isPlaying).toBe(false);
    });
  });

  describe('stopPlayback', () => {
    it('should stop current playback and clear queue', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({
        sound: mockSound,
      });

      await store.addToQueue('test-audio-1.mp3');
      await store.addToQueue('test-audio-2.mp3');

      await store.stopPlayback();

      expect(mockSound.stopAsync).toHaveBeenCalled();
      expect(mockSound.unloadAsync).toHaveBeenCalled();
      expect(store.audioQueue).toHaveLength(0);
      expect(store.isPlaying).toBe(false);
    });

    it('should handle stop errors gracefully', async () => {
      const error = new Error('Stop error');
      mockSound.stopAsync.mockRejectedValueOnce(error);

      (Audio.Sound.createAsync as jest.Mock).mockResolvedValueOnce({
        sound: mockSound,
      });

      await store.addToQueue('test-audio-1.mp3');
      await store.stopPlayback();

      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          action: 'stop_playback',
        })
      );
    });
  });
});

describe('Text-to-Speech Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate speech from text', async () => {
    const mockResponse = new Blob(['audio-data'], { type: 'audio/mpeg' });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockResponse),
    });

    const audioUrl = await generateSpeech('Test text');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('elevenlabs.io'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('Test text'),
      })
    );

    expect(audioUrl).toBeTruthy();
  });

  it('should handle text-to-speech errors', async () => {
    const error = new Error('API error');
    global.fetch = jest.fn().mockRejectedValueOnce(error);

    await expect(generateSpeech('Test text')).rejects.toThrow();
    expect(errorHandler.handleError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        text: 'Test text',
      })
    );
  });
}); 