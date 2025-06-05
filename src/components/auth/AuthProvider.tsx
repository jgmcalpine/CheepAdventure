import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

type AuthContextType = {
	isAuthenticated: boolean;
	isLoading: boolean;
	profile: Profile | null;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, username: string) => Promise<void>;
	signOut: () => Promise<void>;
	updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

type Props = {
	children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
	const [isLoading, setIsLoading] = useState(true);
	const [profile, setProfile] = useState<Profile | null>(null);

	// Check for existing session on mount
	useEffect(() => {
		checkUser();
	}, []);

	const checkUser = async () => {
		try {
			const { data: { session }, error } = await supabase.auth.getSession();
			if (error) throw error;

			if (session?.user) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', session.user.id)
					.single();

				setProfile(profile);
			}
		} catch (error) {
			console.error('Error checking auth state:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const signIn = useCallback(async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) throw error;
		await checkUser();
	}, []);

	const signUp = useCallback(async (email: string, password: string, username: string) => {
		const { error: signUpError, data } = await supabase.auth.signUp({
			email,
			password,
		});

		if (signUpError) throw signUpError;

		if (data.user) {
			const { error: profileError } = await supabase.from('profiles').insert({
				id: data.user.id,
				username,
			});

			if (profileError) throw profileError;
		}

		await checkUser();
	}, []);

	const signOut = useCallback(async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
		setProfile(null);
	}, []);

	const updateProfile = useCallback(async (updates: Partial<Profile>) => {
		if (!profile?.id) throw new Error('No user logged in');

		const { error, data } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', profile.id)
			.select()
			.single();

		if (error) throw error;
		setProfile(data);
	}, [profile?.id]);

	const value = useMemo(
		() => ({
			isAuthenticated: !!profile,
			isLoading,
			profile,
			signIn,
			signUp,
			signOut,
			updateProfile,
		}),
		[isLoading, profile, signIn, signUp, signOut, updateProfile]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 