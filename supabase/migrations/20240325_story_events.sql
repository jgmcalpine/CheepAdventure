-- Create user_nostr_keys table to link Supabase users with Nostr pubkeys
create table if not exists public.user_nostr_keys (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    pubkey text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, pubkey)
);

-- Create story_metadata table to store story information
create table if not exists public.story_metadata (
    id uuid default gen_random_uuid() primary key,
    nostr_event_id text not null unique,
    author_pubkey text not null,
    title text not null,
    description text,
    cover_image_url text,
    price_sats bigint default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create story_chapters table to store chapter information
create table if not exists public.story_chapters (
    id uuid default gen_random_uuid() primary key,
    story_id uuid references public.story_metadata(id) on delete cascade,
    nostr_event_id text not null unique,
    chapter_number integer not null,
    title text not null,
    content text not null,
    choices jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(story_id, chapter_number)
);

-- Create story_payments table to track Lightning payments
create table if not exists public.story_payments (
    id uuid default gen_random_uuid() primary key,
    story_id uuid references public.story_metadata(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    amount_sats bigint not null,
    payment_hash text not null unique,
    payment_preimage text,
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.user_nostr_keys enable row level security;
alter table public.story_metadata enable row level security;
alter table public.story_chapters enable row level security;
alter table public.story_payments enable row level security;

-- User Nostr keys policies
create policy "Users can read their own Nostr keys"
    on public.user_nostr_keys for select
    using (auth.uid() = user_id);

create policy "Users can insert their own Nostr keys"
    on public.user_nostr_keys for insert
    with check (auth.uid() = user_id);

-- Story metadata policies
create policy "Anyone can read story metadata"
    on public.story_metadata for select
    using (true);

create policy "Authors can insert story metadata"
    on public.story_metadata for insert
    with check (exists (
        select 1 from public.user_nostr_keys
        where user_id = auth.uid()
        and pubkey = author_pubkey
    ));

-- Story chapters policies
create policy "Anyone can read free story chapters"
    on public.story_chapters for select
    using (
        exists (
            select 1 from public.story_metadata
            where id = story_chapters.story_id
            and price_sats = 0
        )
    );

create policy "Paid users can read premium story chapters"
    on public.story_chapters for select
    using (
        exists (
            select 1 from public.story_payments
            where story_id = story_chapters.story_id
            and user_id = auth.uid()
            and status = 'completed'
        )
    );

create policy "Authors can insert story chapters"
    on public.story_chapters for insert
    with check (exists (
        select 1 from public.story_metadata m
        join public.user_nostr_keys k on k.pubkey = m.author_pubkey
        where m.id = story_chapters.story_id
        and k.user_id = auth.uid()
    ));

-- Story payments policies
create policy "Users can read their own payments"
    on public.story_payments for select
    using (auth.uid() = user_id);

create policy "Users can insert their own payments"
    on public.story_payments for insert
    with check (auth.uid() = user_id);

-- Create indexes
create index if not exists idx_user_nostr_keys_pubkey on public.user_nostr_keys(pubkey);
create index if not exists idx_story_metadata_author_pubkey on public.story_metadata(author_pubkey);
create index if not exists idx_story_chapters_story_id on public.story_chapters(story_id);
create index if not exists idx_story_payments_user_id on public.story_payments(user_id);
create index if not exists idx_story_payments_story_id on public.story_payments(story_id); 