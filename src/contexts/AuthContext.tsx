import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentUser } from '../services/supabase';

type AuthContextType = {
	user: User | null;
	loading: boolean;
	error: Error | null;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	error: null,
});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		// Check for existing session
		const checkUser = async () => {
			try {
				const { user, error } = await getCurrentUser();
				if (error) throw error;
				setUser(user);
			} catch (err) {
				setError(err instanceof Error ? err : new Error('An error occurred'));
			} finally {
				setLoading(false);
			}
		};

		checkUser();

		// Subscribe to auth state changes
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				setUser(session?.user ?? null);
				setLoading(false);
			}
		);

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading, error }}>
			{children}
		</AuthContext.Provider>
	);
}; 