'use client';

import { createContext, useContext, useEffect } from 'react';
import { init, requestProvider, onConnected, onDisconnected } from '@getalby/bitcoin-connect-react';
import type { WebLNProvider } from '@webbtc/webln-types';

interface LightningContextType {
	requestPayment: (invoice: string) => Promise<{ preimage: string }>;
	requestProvider: () => Promise<WebLNProvider>;
}

const LightningContext = createContext<LightningContextType>({
	requestPayment: async () => ({ preimage: '' }),
	requestProvider: async () => ({} as WebLNProvider),
});

export function LightningProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// Initialize Bitcoin Connect
		init({
			appName: 'Choose Your Own Adventure',
			showBalance: false,
		});

		const unsubConnected = onConnected((provider) => {
			// Make WebLN provider globally available
			window.webln = provider;
		});

		const unsubDisconnected = onDisconnected(() => {
			// Remove WebLN provider when disconnected
			window.webln = undefined;
		});

		return () => {
			unsubConnected();
			unsubDisconnected();
		};
	}, []);

	const requestPayment = async (invoice: string) => {
		try {
			const provider = await requestProvider();
			await provider.enable();
			return await provider.sendPayment(invoice);
		} catch (error) {
			console.error('Failed to process payment:', error);
			throw error;
		}
	};

	return (
		<LightningContext.Provider
			value={{
				requestPayment,
				requestProvider,
			}}
		>
			{children}
		</LightningContext.Provider>
	);
}

export function useLightning() {
	return useContext(LightningContext);
} 