'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import NDK, { NDKUser, NDKEvent, NDKNip07Signer } from '@nostr-dev-kit/ndk';

type AuthContextType = {
	user: NDKUser | null;
	isConnecting: boolean;
	connect: () => Promise<void>;
	disconnect: () => void;
};

const AuthContext = createContext<AuthContextType>({
	user: null,
	isConnecting: false,
	connect: async () => {},
	disconnect: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<NDKUser | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);
	const [ndk, setNDK] = useState<NDK | null>(null);

	useEffect(() => {
		const initNDK = async () => {
			const newNDK = new NDK({
				explicitRelayUrls: [
					'wss://relay.damus.io',
					'wss://relay.snort.social',
					'wss://nos.lol',
				],
			});
			await newNDK.connect();
			setNDK(newNDK);
		};

		initNDK();
	}, []);

	const connect = useCallback(async () => {
		if (!ndk) return;

		try {
			setIsConnecting(true);
			const signer = new NDKNip07Signer();
			await signer.blockUntilReady();
			ndk.signer = signer;

			const pubkey = await signer.getPublicKey();
			const user = ndk.getUser({ pubkey });
			await user.fetchProfile();

			setUser(user);
		} catch (error) {
			console.error('Failed to connect:', error);
		} finally {
			setIsConnecting(false);
		}
	}, [ndk]);

	const disconnect = useCallback(() => {
		setUser(null);
		if (ndk) {
			ndk.signer = undefined;
		}
	}, [ndk]);

	return (
		<AuthContext.Provider
			value={{
				user,
				isConnecting,
				connect,
				disconnect,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
} 