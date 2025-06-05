-- Drop existing tables if they exist
drop table if exists public.analytics_events;
drop table if exists public.listening_sessions;
drop table if exists public.plays;
drop table if exists public.games;
drop table if exists public.profiles;

-- Create profiles table (extends Supabase auth users)
create table public.profiles (
  id uuid primary key references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  username text unique,
  preferences jsonb default '{}'::jsonb
);

-- Create games table
create table public.games (
  id text primary key, -- MLB game ID
  game_date date not null,
  home_team text not null,
  away_team text not null,
  status text not null, -- 'scheduled', 'live', 'final'
  inning integer default 0,
  inning_half text, -- 'top', 'bottom'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create plays table
create table public.plays (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  play_id text not null, -- MLB play ID
  sequence_number integer not null,
  inning integer not null,
  inning_half text not null,
  description text not null,
  audio_url text, -- URL to generated audio file
  audio_generated_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(game_id, play_id)
);

-- Create listening sessions table
create table public.listening_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  game_id text not null references games(id),
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  last_play_sequence integer default 0
);

-- Create analytics events table
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.plays enable row level security;
alter table public.listening_sessions enable row level security;
alter table public.analytics_events enable row level security;

-- RLS Policies

-- Profiles: Users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Games: Authenticated users can read all games
create policy "Games are publicly readable"
  on public.games for select
  to authenticated
  using (true);

-- Plays: Authenticated users can read all plays
create policy "Plays are publicly readable"
  on public.plays for select
  to authenticated
  using (true);

-- Listening sessions: Users can only access their own sessions
create policy "Users can manage own sessions"
  on public.listening_sessions
  for all
  using (auth.uid() = user_id);

-- Analytics: Users can only insert their own events
create policy "Users can insert own analytics"
  on public.analytics_events
  for insert
  with check (auth.uid() = user_id);

-- Create indexes for performance
create index idx_games_date_status on games(game_date, status);
create index idx_plays_game_sequence on plays(game_id, sequence_number);
create index idx_sessions_user_game on listening_sessions(user_id, game_id);
create index idx_analytics_user_type on analytics_events(user_id, event_type);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_games_updated_at
  before update on public.games
  for each row
  execute function public.handle_updated_at(); 