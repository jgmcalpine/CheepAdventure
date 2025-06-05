import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// SecureStore adapter implementation for Supabase
const ExpoSecureStoreAdapter = {
	getItem: (key: string) => {
		return SecureStore.getItemAsync(key);
	},
	setItem: (key: string, value: string) => {
		return SecureStore.setItemAsync(key, value);
	},
	removeItem: (key: string) => {
		return SecureStore.deleteItemAsync(key);
	},
};

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: ExpoSecureStoreAdapter,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});

// Helper functions for authentication
export const signUp = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
	});
	return { data, error };
};

export const signIn = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});
	return { data, error };
};

export const signOut = async () => {
	const { error } = await supabase.auth.signOut();
	return { error };
};

export const getCurrentUser = async () => {
	const { data: { user }, error } = await supabase.auth.getUser();
	return { user, error };
}; 