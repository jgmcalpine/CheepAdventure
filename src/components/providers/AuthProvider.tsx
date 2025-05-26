'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useNostr } from './NostrProvider';
import type { NDKUser } from '@nostr-dev-kit/ndk';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
	user: User | null;
	nostrUser: NDKUser | null;
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signInWithNostr: () => Promise<void>;
	signOut: () => Promise<void>;
	linkNostrAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	nostrUser: null,
	signInWithEmail: async () => {},
	signUpWithEmail: async () => {},
	signInWithNostr: async () => {},
	signOut: async () => {},
	linkNostrAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const supabase = createClientComponentClient();
	const { ndk, signer, setSigner } = useNostr();
	const [user, setUser] = useState<User | null>(null);
	const [nostrUser, setNostrUser] = useState<NDKUser | null>(null);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	useEffect(() => {
		// Check for linked Nostr account when user changes
		if (user) {
			supabase
				.from('user_nostr_keys')
				.select('pubkey')
				.eq('user_id', user.id)
				.single()
				.then(({ data, error }) => {
					if (!error && data?.pubkey && ndk) {
						// If we have a linked pubkey, try to get the NDK user
						ndk.getUser({ pubkey: data.pubkey }).then((ndkUser) => {
							setNostrUser(ndkUser);
						});
					}
				});
		}
	}, [user, ndk]);

	const signInWithEmail = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) throw error;
	};

	const signUpWithEmail = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) throw error;
	};

	const signInWithNostr = async () => {
		if (!ndk) throw new Error('NDK not initialized');

		try {
			// Request public key via NIP-07
			const nostrSigner = await ndk.signer;
			if (!nostrSigner) throw new Error('No Nostr signer available');

			setSigner(nostrSigner);
			const ndkUser = await nostrSigner.user();
			setNostrUser(ndkUser);

			// Check if this Nostr pubkey is linked to a Supabase account
			const { data, error } = await supabase
				.from('user_nostr_keys')
				.select('user_id')
				.eq('pubkey', ndkUser.pubkey)
				.single();

			if (!error && data?.user_id) {
				// If linked, sign in as that user
				const { error: signInError } = await supabase.auth.signInWithId(data.user_id);
				if (signInError) throw signInError;
			}
		} catch (error) {
			console.error('Failed to sign in with Nostr:', error);
			throw error;
		}
	};

	const signOut = async () => {
		await supabase.auth.signOut();
		setSigner(null);
		setNostrUser(null);
	};

	const linkNostrAccount = async () => {
		if (!user) throw new Error('No user logged in');
		if (!ndk) throw new Error('NDK not initialized');

		try {
			// Request public key via NIP-07
			const nostrSigner = await ndk.signer;
			if (!nostrSigner) throw new Error('No Nostr signer available');

			setSigner(nostrSigner);
			const ndkUser = await nostrSigner.user();
			setNostrUser(ndkUser);

			// Link Nostr account to Supabase user
			const { error } = await supabase.from('user_nostr_keys').upsert({
				user_id: user.id,
				pubkey: ndkUser.pubkey,
				created_at: new Date().toISOString(),
			});
			if (error) throw error;
		} catch (error) {
			console.error('Failed to link Nostr account:', error);
			throw error;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				nostrUser,
				signInWithEmail,
				signUpWithEmail,
				signInWithNostr,
				signOut,
				linkNostrAccount,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
} 