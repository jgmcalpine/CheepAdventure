# Sports Play-by-Play Audio App

A mobile application that provides real-time audio play-by-play for live MLB games.

## Features

- Real-time game updates and scores
- Live play-by-play audio streaming
- User authentication and profiles
- Proper audio sequencing and rate limiting
- Offline support and error handling

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase (Backend & Auth)
- ElevenLabs (Text-to-Speech)
- MLB StatsAPI (Game Data)

## Prerequisites

- Node.js 20 LTS
- Expo CLI
- Supabase Account
- ElevenLabs API Key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Development

- Run on iOS:
  ```bash
  npm run ios
  ```

- Run on Android:
  ```bash
  npm run android
  ```

- Run tests:
  ```bash
  npm test
  ```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/    # Reusable UI components
│   ├── screens/       # Screen components
│   ├── services/      # API and service integrations
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── assets/           # Static assets
└── supabase/        # Supabase configuration and functions
```

## Supabase Setup

1. Create a new Supabase project
2. Run the database migrations
3. Deploy the Edge Functions:
   - `fetch-games`: Fetches MLB games
   - `fetch-plays`: Fetches play-by-play data
   - `generate-audio`: Generates audio using ElevenLabs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 