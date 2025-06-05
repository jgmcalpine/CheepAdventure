import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MLB Play-by-Play Audio',
  slug: 'mlb-play-by-play-audio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mlbplaybyplay.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.mlbplaybyplay.app'
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    mlbStatsApiUrl: process.env.MLB_STATS_API_URL || 'https://statsapi.mlb.com/api',
    eas: {
      projectId: 'your-project-id'
    }
  },
  plugins: [
    'expo-secure-store',
    'expo-auth-session'
  ]
}); 