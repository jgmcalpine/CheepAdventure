-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (handled by Supabase Auth, extend with profiles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Games table
CREATE TABLE games (
  id TEXT PRIMARY KEY, -- MLB game ID
  game_date DATE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  status TEXT NOT NULL, -- 'scheduled', 'live', 'final'
  inning INTEGER DEFAULT 0,
  inning_half TEXT, -- 'top', 'bottom'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plays table
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL REFERENCES games(id),
  play_id TEXT NOT NULL, -- MLB play ID
  sequence_number INTEGER NOT NULL,
  inning INTEGER NOT NULL,
  inning_half TEXT NOT NULL,
  description TEXT NOT NULL,
  audio_url TEXT, -- URL to generated audio file
  audio_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, play_id)
);

-- User listening sessions
CREATE TABLE listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  game_id TEXT NOT NULL REFERENCES games(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_play_sequence INTEGER DEFAULT 0
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_games_date_status ON games(game_date, status);
CREATE INDEX idx_plays_game_sequence ON plays(game_id, sequence_number);
CREATE INDEX idx_sessions_user_game ON listening_sessions(user_id, game_id);
CREATE INDEX idx_analytics_user_type ON analytics_events(user_id, event_type);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Listening sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON listening_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Analytics: Users can only insert their own events
CREATE POLICY "Users can insert own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Games and plays are publicly readable
CREATE POLICY "Games are publicly readable" ON games
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Plays are publicly readable" ON plays
  FOR SELECT TO authenticated USING (true); 