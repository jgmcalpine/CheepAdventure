import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: 'Sports Play-by-Play',
	slug: 'sports-play-by-play',
	version: '1.0.0',
	orientation: 'portrait',
	icon: './assets/icon.png',
	userInterfaceStyle: 'light',
	splash: {
		image: './assets/splash.png',
		resizeMode: 'contain',
		backgroundColor: '#ffffff',
	},
	assetBundlePatterns: ['**/*'],
	ios: {
		supportsTablet: true,
		bundleIdentifier: 'com.sportsplaybyplay',
	},
	android: {
		adaptiveIcon: {
			foregroundImage: './assets/adaptive-icon.png',
			backgroundColor: '#ffffff',
		},
		package: 'com.sportsplaybyplay',
	},
	extra: {
		supabaseUrl: process.env.SUPABASE_URL,
		supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
		elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
	},
	plugins: [
		'expo-secure-store',
	],
}); 