-- Drop existing tables if they exist
drop table if exists fsm_steps;
drop table if exists fsm_metadata;

-- Story metadata (Nostr kind: 30077)
create table stories (
  id uuid default uuid_generate_v4() primary key,
  pubkey text not null,
  title text not null,
  description text,
  cover_url text,
  genre text,
  lnurlp text,
  total_price integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone,
  lifecycle text not null check (lifecycle in ('draft', 'published')),
  event_id text unique,
  original_author_id text -- For admin-signed events
);

-- Chapter steps (Nostr kind: 30078)
create table chapter_steps (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references stories(id) on delete cascade,
  step_id text not null,
  parent_step_id text,
  choice_text text,
  price integer default 0,
  content_type text not null check (content_type in ('text', 'markdown', 'html', 'image', 'video')),
  content text not null,
  is_end_step boolean default false,
  position_x double precision default 0,
  position_y double precision default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id text unique,
  unique(story_id, step_id)
);

-- Payment proofs (Nostr kind: 30079)
create table payment_proofs (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references stories(id) on delete cascade,
  step_id text not null,
  payer_pubkey text not null,
  invoice text not null,
  preimage text not null,
  paid_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id text unique,
  unique(story_id, step_id, payer_pubkey)
);

-- Completion badges (Nostr kind: 30080)
create table completion_badges (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references stories(id) on delete cascade,
  reader_pubkey text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id text unique,
  unique(story_id, reader_pubkey)
);

-- Analytics events
create table analytics_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text not null check (event_type in ('page_view', 'chapter_view', 'purchase')),
  story_id uuid references stories(id) on delete cascade,
  step_id text,
  user_pubkey text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Updated at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger update_stories_updated_at
  before update on stories
  for each row
  execute function update_updated_at_column();

create trigger update_chapter_steps_updated_at
  before update on chapter_steps
  for each row
  execute function update_updated_at_column();

-- Row Level Security (RLS) policies
alter table stories enable row level security;
alter table chapter_steps enable row level security;
alter table payment_proofs enable row level security;
alter table completion_badges enable row level security;
alter table analytics_events enable row level security;

-- Stories policies
create policy "Public stories are viewable by everyone"
  on stories for select
  using (lifecycle = 'published');

create policy "Users can create stories"
  on stories for insert
  with check (auth.uid()::text = pubkey or auth.uid()::text = original_author_id);

create policy "Users can update their own stories"
  on stories for update
  using (auth.uid()::text = pubkey or auth.uid()::text = original_author_id);

-- Chapter steps policies
create policy "Public chapter steps are viewable by everyone"
  on chapter_steps for select
  using (exists (
    select 1 from stories
    where stories.id = chapter_steps.story_id
    and stories.lifecycle = 'published'
  ));

create policy "Users can create chapter steps for their stories"
  on chapter_steps for insert
  with check (exists (
    select 1 from stories
    where stories.id = chapter_steps.story_id
    and (stories.pubkey = auth.uid()::text or stories.original_author_id = auth.uid()::text)
  ));

create policy "Users can update chapter steps for their stories"
  on chapter_steps for update
  using (exists (
    select 1 from stories
    where stories.id = chapter_steps.story_id
    and (stories.pubkey = auth.uid()::text or stories.original_author_id = auth.uid()::text)
  ));

-- Payment proofs policies
create policy "Users can view their own payment proofs"
  on payment_proofs for select
  using (auth.uid()::text = payer_pubkey);

create policy "Users can create payment proofs"
  on payment_proofs for insert
  with check (auth.uid()::text = payer_pubkey);

-- Completion badges policies
create policy "Users can view their own completion badges"
  on completion_badges for select
  using (auth.uid()::text = reader_pubkey);

create policy "Users can create completion badges"
  on completion_badges for insert
  with check (auth.uid()::text = reader_pubkey);

-- Analytics events policies
create policy "Analytics events are insertable by authenticated users"
  on analytics_events for insert
  with check (auth.uid() is not null);

create policy "Analytics events are viewable by story owners"
  on analytics_events for select
  using (exists (
    select 1 from stories
    where stories.id = analytics_events.story_id
    and (stories.pubkey = auth.uid()::text or stories.original_author_id = auth.uid()::text)
  )); 