import { createClient } from '@supabase/supabase-js';

// Types for our database tables
export type Profile = {
	id: string;
	username: string;
	preferences: Record<string, unknown>;
	created_at: string;
	updated_at: string;
};

export type Game = {
	id: string;
	game_date: string;
	home_team: string;
	away_team: string;
	status: 'scheduled' | 'live' | 'final';
	inning?: number;
	inning_half?: 'top' | 'bottom';
	created_at: string;
	updated_at: string;
};

export type Play = {
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
};

export type ListeningSession = {
	id: string;
	user_id: string;
	game_id: string;
	started_at: string;
	ended_at?: string;
	last_play_sequence: number;
};

export type AnalyticsEvent = {
	id: string;
	user_id?: string;
	event_type: string;
	event_data: Record<string, unknown>;
	created_at: string;
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Profile helper functions
export const getProfile = async (userId: string) => {
	const { data, error } = await supabase
		.from('profiles')
		.select()
		.eq('id', userId)
		.single();

	if (error) throw error;
	return data as Profile;
};

export const updateProfile = async (userId: string, profile: Partial<Profile>) => {
	const { data, error } = await supabase
		.from('profiles')
		.update(profile)
		.eq('id', userId)
		.select()
		.single();

	if (error) throw error;
	return data as Profile;
};

// Game helper functions
export const getTodaysGames = async () => {
	const today = new Date().toISOString().split('T')[0];
	const { data, error } = await supabase
		.from('games')
		.select()
		.eq('game_date', today)
		.order('created_at', { ascending: true });

	if (error) throw error;
	return data as Game[];
};

export const getGame = async (gameId: string) => {
	const { data, error } = await supabase
		.from('games')
		.select()
		.eq('id', gameId)
		.single();

	if (error) throw error;
	return data as Game;
};

// Play helper functions
export const getGamePlays = async (gameId: string) => {
	const { data, error } = await supabase
		.from('plays')
		.select()
		.eq('game_id', gameId)
		.order('sequence_number', { ascending: true });

	if (error) throw error;
	return data as Play[];
};

export const getPlaysAfterSequence = async (gameId: string, sequenceNumber: number) => {
	const { data, error } = await supabase
		.from('plays')
		.select()
		.eq('game_id', gameId)
		.gt('sequence_number', sequenceNumber)
		.order('sequence_number', { ascending: true });

	if (error) throw error;
	return data as Play[];
};

// Listening session helper functions
export const startListeningSession = async (userId: string, gameId: string) => {
	const { data, error } = await supabase
		.from('listening_sessions')
		.insert({ user_id: userId, game_id: gameId })
		.select()
		.single();

	if (error) throw error;
	return data as ListeningSession;
};

export const updateListeningSession = async (sessionId: string, updates: Partial<ListeningSession>) => {
	const { data, error } = await supabase
		.from('listening_sessions')
		.update(updates)
		.eq('id', sessionId)
		.select()
		.single();

	if (error) throw error;
	return data as ListeningSession;
};

// Analytics helper functions
export const trackEvent = async (eventType: string, eventData: Record<string, unknown>, userId?: string) => {
	const { error } = await supabase
		.from('analytics_events')
		.insert({ event_type: eventType, event_data: eventData, user_id: userId });

	if (error) throw error;
}; 