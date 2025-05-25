import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode
} from 'react';
import {
	createClientComponentClient,
	Session
} from '@supabase/auth-helpers-nextjs';
import { User, AuthError } from '@supabase/supabase-js';
import { getPublicKey, hasNostrExtension } from '../nostr/config';

interface AuthState {
	user: User | null;
	nostrPubkey: string | null;
	loading: boolean;
	error: string | null;
}

interface AuthContextType extends AuthState {
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signUpWithEmail: (email: string, password: string) => Promise<void>;
	signInWithNostr: () => Promise<void>;
	linkNostr: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		nostrPubkey: null,
		loading: true,
		error: null
	});

	const supabase = createClientComponentClient();

	useEffect(() => {
		// Check Supabase session
		supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
			setState((prev: AuthState) => ({
				...prev,
				user: session?.user ?? null,
				loading: false
			}));
		});

		// Subscribe to auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
			setState((prev: AuthState) => ({
				...prev,
				user: session?.user ?? null
			}));
		});

		// Check for Nostr extension and pubkey
		if (hasNostrExtension()) {
			getPublicKey().then(pubkey => {
				setState((prev: AuthState) => ({
					...prev,
					nostrPubkey: pubkey
				}));
			});
		}

		return () => subscription.unsubscribe();
	}, []);

	const signInWithEmail = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password
			});
			if (error) throw error;
		} catch (error) {
			setState((prev: AuthState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to sign in'
			}));
		}
	};

	const signUpWithEmail = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password
			});
			if (error) throw error;
		} catch (error) {
			setState((prev: AuthState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to sign up'
			}));
		}
	};

	const signInWithNostr = async () => {
		try {
			if (!hasNostrExtension()) {
				throw new Error('Nostr extension not found');
			}

			const pubkey = await getPublicKey();
			if (!pubkey) {
				throw new Error('Failed to get Nostr public key');
			}

			// Sign in or create user with Nostr pubkey as ID
			const { error } = await supabase.auth.signInWithPassword({
				email: `${pubkey}@nostr.local`,
				password: pubkey // This is safe as it's only used for Nostr users
			});

			if (error?.message.includes('Invalid login credentials')) {
				// User doesn't exist, create new account
				const { error: signUpError } = await supabase.auth.signUp({
					email: `${pubkey}@nostr.local`,
					password: pubkey
				});
				if (signUpError) throw signUpError;
			} else if (error) {
				throw error;
			}

			setState((prev: AuthState) => ({
				...prev,
				nostrPubkey: pubkey
			}));
		} catch (error) {
			setState((prev: AuthState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to sign in with Nostr'
			}));
		}
	};

	const linkNostr = async () => {
		try {
			if (!state.user) {
				throw new Error('Must be signed in to link Nostr');
			}

			if (!hasNostrExtension()) {
				throw new Error('Nostr extension not found');
			}

			const pubkey = await getPublicKey();
			if (!pubkey) {
				throw new Error('Failed to get Nostr public key');
			}

			// Update user metadata to include Nostr pubkey
			const { error } = await supabase.auth.updateUser({
				data: {
					nostr_pubkey: pubkey
				}
			});

			if (error) throw error;

			setState((prev: AuthState) => ({
				...prev,
				nostrPubkey: pubkey
			}));
		} catch (error) {
			setState((prev: AuthState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to link Nostr'
			}));
		}
	};

	const signOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			setState((prev: AuthState) => ({
				...prev,
				user: null,
				nostrPubkey: null
			}));
		} catch (error) {
			setState((prev: AuthState) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to sign out'
			}));
		}
	};

	const value = {
		...state,
		signInWithEmail,
		signUpWithEmail,
		signInWithNostr,
		linkNostr,
		signOut
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
} 