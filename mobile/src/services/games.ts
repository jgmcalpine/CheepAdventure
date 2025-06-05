import { supabase } from './supabase';

export interface Game {
  id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  status: 'scheduled' | 'live' | 'final';
  inning?: number;
  inning_half?: 'top' | 'bottom';
  created_at: string;
  updated_at: string;
}

export interface Play {
  id: string;
  game_id: string;
  play_id: string;
  sequence_number: number;
  inning: number;
  inning_half: 'top' | 'bottom';
  description: string;
  audio_url?: string;
  audio_generated_at?: string;
  created_at: string;
}

export async function fetchTodayGames(): Promise<Game[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('game_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching games:', error);
    throw error;
  }

  return data;
}

export async function fetchGamePlays(gameId: string): Promise<Play[]> {
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('game_id', gameId)
    .order('sequence_number', { ascending: true });

  if (error) {
    console.error('Error fetching plays:', error);
    throw error;
  }

  return data;
}

export function subscribeToGameUpdates(
  gameId: string,
  onUpdate: (game: Game) => void
): () => void {
  const subscription = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      },
      (payload) => {
        onUpdate(payload.new as Game);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export function subscribeToNewPlays(
  gameId: string,
  onNewPlay: (play: Play) => void
): () => void {
  const subscription = supabase
    .channel(`plays:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'plays',
        filter: `game_id=eq.${gameId}`,
      },
      (payload) => {
        onNewPlay(payload.new as Play);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export async function startListeningSession(gameId: string): Promise<void> {
  const { error } = await supabase.from('listening_sessions').insert({
    game_id: gameId,
  });

  if (error) {
    console.error('Error starting listening session:', error);
    throw error;
  }
}

export async function endListeningSession(
  gameId: string,
  lastPlaySequence: number
): Promise<void> {
  const { error } = await supabase
    .from('listening_sessions')
    .update({
      ended_at: new Date().toISOString(),
      last_play_sequence: lastPlaySequence,
    })
    .eq('game_id', gameId)
    .is('ended_at', null);

  if (error) {
    console.error('Error ending listening session:', error);
    throw error;
  }
} 