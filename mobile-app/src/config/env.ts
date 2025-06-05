import Constants from 'expo-constants';

// Environment variable types
type Environment = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  elevenLabsApiKey: string;
  mlbStatsApiUrl: string;
};

// Get the environment variables from Expo's Constants
const ENV = Constants.expoConfig?.extra as Environment;

// Validate environment variables
if (!ENV || !ENV.supabaseUrl || !ENV.supabaseAnonKey || !ENV.elevenLabsApiKey || !ENV.mlbStatsApiUrl) {
  throw new Error('Missing required environment variables. Check your app.config.ts file.');
}

export default {
  SUPABASE_URL: ENV.supabaseUrl,
  SUPABASE_ANON_KEY: ENV.supabaseAnonKey,
  ELEVENLABS_API_KEY: ENV.elevenLabsApiKey,
  MLB_STATS_API_URL: ENV.mlbStatsApiUrl,
} as const; 