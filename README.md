# FSM Builder

A web application for building and managing Finite State Machines (FSM) with support for text, image, and video content in each state.

## Features

- Create and manage FSMs with multiple steps
- Support for text, image, and video content in each step
- Visual FSM editor with drag-and-drop interface
- Real-time FSM visualization
- Multiple transitions between steps
- Persistent storage with Supabase

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- XState for FSM implementation
- ReactFlow for FSM visualization
- Supabase for backend
- TailwindCSS for styling
- React Player for video playback

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project and set up the following environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the Supabase database schema:

   ```sql
   -- FSM metadata table
   create table fsm_metadata (
     id uuid default uuid_generate_v4() primary key,
     title text not null,
     description text,
     user_id uuid not null,
     num_steps integer default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- FSM steps table
   create table fsm_steps (
     id uuid default uuid_generate_v4() primary key,
     fsm_id uuid references fsm_metadata(id) on delete cascade,
     title text not null,
     content text,
     media_type text not null check (media_type in ('text', 'image', 'video')),
     media_url text,
     next_steps uuid[] default array[]::uuid[],
     position_x double precision default 0,
     position_y double precision default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
   create trigger update_fsm_metadata_updated_at
     before update on fsm_metadata
     for each row
     execute function update_updated_at_column();

   create trigger update_fsm_steps_updated_at
     before update on fsm_steps
     for each row
     execute function update_updated_at_column();
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Create a new FSM by providing a title and description
2. Add steps to your FSM:
   - Click the "Create Step" button
   - Enter step details (title, content, media)
   - Choose the media type (text, image, or video)
   - Add content or media URL
3. Connect steps:
   - Drag from a step's output handle to another step's input handle
   - Multiple connections are supported
4. Edit or delete steps:
   - Click on a step to select it
   - Use the editor panel to modify or delete the step
5. Save your changes:
   - All changes are automatically saved to the database

## Development

- `src/components/fsm-builder/`: FSM builder components
- `src/lib/supabase.ts`: Supabase configuration and helper functions
- `src/app/fsm/`: FSM-related pages

## License

MIT
