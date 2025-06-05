# Sports Play-by-Play Audio App

A React Native mobile application that provides live play-by-play audio commentary for MLB games.

## Features

- Live and upcoming MLB games list
- Real-time game scores and updates
- Live play-by-play audio streaming
- User authentication with Supabase
- Profile management

## Tech Stack

- React Native with Expo
- TypeScript
- Supabase for authentication and backend
- MLB StatsAPI for game data
- Expo AV for audio playback
- React Navigation for routing
- TanStack Query for data fetching
- React Hook Form + Zod for form handling

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Expo CLI
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sports-play-by-play
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Follow the Expo CLI instructions to run the app on your device or emulator.

## Development

### Project Structure

```
src/
  ├── components/     # Reusable components
  ├── contexts/       # React contexts
  ├── navigation/     # Navigation setup
  ├── screens/        # Screen components
  ├── services/       # API and service functions
  ├── types/          # TypeScript type definitions
  └── utils/          # Utility functions
```

### Key Components

- `AuthContext`: Manages user authentication state
- `Navigation`: Handles app navigation and routing
- `GamesListScreen`: Displays live and upcoming games
- `GameDetailsScreen`: Shows game details and audio controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
