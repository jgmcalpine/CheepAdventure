# Sports Play-by-Play Audio App

A mobile application that provides real-time audio play-by-play for live sporting events by fetching game data from public APIs, converting text to speech using ElevenLabs, and streaming audio to authenticated users.

## Features

- Authentication: Users can sign up, log in, and log out
- Game Discovery: Display current day's MLB games with live status
- Audio Streaming: Convert play-by-play text to speech and stream to users
- Real-time Updates: Fetch new plays every few seconds while respecting API limits
- Play Sequencing: Ensure plays are delivered in correct chronological order

## Tech Stack

- React Native with Expo
- TypeScript
- Expo AV for audio playback
- React Navigation for navigation
- React Query/TanStack Query for data fetching
- Zustand for state management
- React Hook Form + Zod for form handling
- Supabase for backend services

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project and set up the following environment variables in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

3. Run the development server:
   ```bash
   npm start
   ```

4. Open the app:
   - iOS: Press 'i' to open in iOS Simulator
   - Android: Press 'a' to open in Android Emulator
   - Scan QR code with Expo Go app to open on your device

## Development

- `src/components/`: React components
- `src/screens/`: Screen components
- `src/services/`: API and service integrations
- `src/hooks/`: Custom React hooks
- `src/utils/`: Utility functions
- `src/types/`: TypeScript type definitions
- `src/store/`: Zustand store configurations

## Testing

Run tests:
```bash
npm test
```

## License

MIT 