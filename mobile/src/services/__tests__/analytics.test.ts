import { analytics } from '../analytics';
import { supabase } from '../supabase';

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Session Management', () => {
    it('should track app open event', async () => {
      await analytics.trackAppOpen();

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'app_open',
        event_data: expect.objectContaining({
          timestamp: expect.any(String),
          session_duration: expect.any(Number),
        }),
      });
    });

    it('should track app close event with session data', async () => {
      // Simulate some time passing
      jest.advanceTimersByTime(5000);

      await analytics.trackAppClose();

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'app_close',
        event_data: expect.objectContaining({
          timestamp: expect.any(String),
          session_duration: 5000,
          total_plays_heard: expect.any(Number),
        }),
      });
    });
  });

  describe('Game Events', () => {
    it('should track game view event', async () => {
      await analytics.trackGameView('game-1', 'Yankees', 'Red Sox');

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'game_view',
        event_data: expect.objectContaining({
          game_id: 'game-1',
          home_team: 'Yankees',
          away_team: 'Red Sox',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should track game listen start event', async () => {
      await analytics.trackGameListenStart('game-1');

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'game_listen_start',
        event_data: expect.objectContaining({
          game_id: 'game-1',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should track game listen end event', async () => {
      await analytics.trackGameListenEnd('game-1', 10);

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'game_listen_end',
        event_data: expect.objectContaining({
          game_id: 'game-1',
          last_play_sequence: 10,
          total_plays_heard: expect.any(Number),
          timestamp: expect.any(String),
        }),
      });
    });

    it('should track play heard event', async () => {
      await analytics.trackPlayHeard('play-1', 'game-1', 5);

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'play_heard',
        event_data: expect.objectContaining({
          play_id: 'play-1',
          game_id: 'game-1',
          sequence_number: 5,
          timestamp: expect.any(String),
        }),
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track audio errors', async () => {
      const error = new Error('Audio playback failed');
      const context = { playId: 'play-1' };

      await analytics.trackError('audio', error, context);

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'audio_failed',
        event_data: expect.objectContaining({
          error_message: error.message,
          error_stack: error.stack,
          playId: 'play-1',
          timestamp: expect.any(String),
        }),
      });
    });

    it('should track API errors', async () => {
      const error = new Error('API request failed');
      const context = { endpoint: '/games' };

      await analytics.trackError('api', error, context);

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'api_error',
        event_data: expect.objectContaining({
          error_message: error.message,
          error_stack: error.stack,
          endpoint: '/games',
          timestamp: expect.any(String),
        }),
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', async () => {
      const metricName = 'time_to_first_play';
      const value = 1500;
      const context = { gameId: 'game-1' };

      await analytics.trackPerformanceMetric(metricName, value, context);

      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(supabase.from('analytics_events').insert).toHaveBeenCalledWith({
        event_type: 'performance_metric',
        event_data: expect.objectContaining({
          metric_name: metricName,
          value,
          gameId: 'game-1',
          timestamp: expect.any(String),
        }),
      });
    });
  });
}); 