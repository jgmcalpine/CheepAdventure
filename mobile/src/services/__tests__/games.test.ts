import { Game, Play, fetchTodayGames, fetchGamePlays, subscribeToGameUpdates, subscribeToNewPlays, startListeningSession, endListeningSession } from '../games';
import { supabase } from '../supabase';
import { PostgrestBuilder, PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';

interface MockQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  is: jest.Mock;
  single: jest.Mock;
}

// Mock Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      };
      return builder as unknown as PostgrestQueryBuilder<any, any, any>;
    }),
    channel: jest.fn((name: string) => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      unsubscribe: jest.fn(),
    })),
  },
}));

describe('GameService', () => {
  const mockGame: Game = {
    id: 'game-1',
    game_date: '2024-06-05',
    home_team: 'Yankees',
    away_team: 'Red Sox',
    status: 'live',
    inning: 5,
    inning_half: 'top',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockPlay: Play = {
    id: 'play-1',
    game_id: 'game-1',
    play_id: 'mlb-play-1',
    sequence_number: 1,
    inning: 5,
    inning_half: 'top',
    description: 'Strike looking',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTodayGames', () => {
    it('should fetch today\'s games', async () => {
      const mockResponse = { data: [mockGame], error: null };
      const mockBuilder = (supabase.from('games') as unknown) as MockQueryBuilder;
      mockBuilder.order.mockResolvedValue(mockResponse);

      const games = await fetchTodayGames();

      expect(supabase.from).toHaveBeenCalledWith('games');
      expect(games).toHaveLength(1);
      expect(games[0]).toEqual(mockGame);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      const mockBuilder = (supabase.from('games') as unknown) as MockQueryBuilder;
      mockBuilder.order.mockResolvedValue({ data: null, error });

      await expect(fetchTodayGames()).rejects.toThrow('Database error');
    });
  });

  describe('fetchGamePlays', () => {
    it('should fetch game plays', async () => {
      const mockResponse = { data: [mockPlay], error: null };
      const mockBuilder = (supabase.from('plays') as unknown) as MockQueryBuilder;
      mockBuilder.order.mockResolvedValue(mockResponse);

      const plays = await fetchGamePlays('game-1');

      expect(supabase.from).toHaveBeenCalledWith('plays');
      expect(plays).toHaveLength(1);
      expect(plays[0]).toEqual(mockPlay);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Database error');
      const mockBuilder = (supabase.from('plays') as unknown) as MockQueryBuilder;
      mockBuilder.order.mockResolvedValue({ data: null, error });

      await expect(fetchGamePlays('game-1')).rejects.toThrow('Database error');
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to game updates', () => {
      const onUpdate = jest.fn();
      const unsubscribe = subscribeToGameUpdates('game-1', onUpdate);

      expect(supabase.channel).toHaveBeenCalledWith('game:game-1');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to new plays', () => {
      const onNewPlay = jest.fn();
      const unsubscribe = subscribeToNewPlays('game-1', onNewPlay);

      expect(supabase.channel).toHaveBeenCalledWith('plays:game-1');
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe when cleanup function is called', () => {
      const mockChannel = supabase.channel('test-channel');
      const unsubscribe = subscribeToGameUpdates('game-1', jest.fn());
      unsubscribe();

      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Listening Sessions', () => {
    it('should start a listening session', async () => {
      const mockBuilder = (supabase.from('listening_sessions') as unknown) as MockQueryBuilder;
      mockBuilder.insert.mockResolvedValue({ data: null, error: null });

      await startListeningSession('game-1');

      expect(supabase.from).toHaveBeenCalledWith('listening_sessions');
      expect(mockBuilder.insert).toHaveBeenCalledWith({
        game_id: 'game-1',
      });
    });

    it('should end a listening session', async () => {
      const mockBuilder = (supabase.from('listening_sessions') as unknown) as MockQueryBuilder;
      mockBuilder.is.mockResolvedValue({ data: null, error: null });

      await endListeningSession('game-1', 10);

      expect(supabase.from).toHaveBeenCalledWith('listening_sessions');
      expect(mockBuilder.update).toHaveBeenCalledWith({
        ended_at: expect.any(String),
        last_play_sequence: 10,
      });
    });

    it('should handle session errors', async () => {
      const error = new Error('Database error');
      const mockBuilder = (supabase.from('listening_sessions') as unknown) as MockQueryBuilder;
      mockBuilder.insert.mockResolvedValue({ data: null, error });

      await expect(startListeningSession('game-1')).rejects.toThrow('Database error');
    });
  });
}); 