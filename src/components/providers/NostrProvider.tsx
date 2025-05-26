'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import NDK, { NDKEvent, NDKFilter, NDKNip07Signer, NDKPrivateKeySigner, NDKSigner } from '@nostr-dev-kit/ndk';

interface NostrContextType {
	ndk: NDK | null;
	signer: NDKSigner | null;
	setSigner: (signer: NDKSigner | null) => void;
	publishEvent: (event: Partial<NDKEvent>) => Promise<NDKEvent | null>;
	queryEvents: (filter: NDKFilter) => Promise<NDKEvent[]>;
}

const NostrContext = createContext<NostrContextType>({
	ndk: null,
	signer: null,
	setSigner: () => {},
	publishEvent: async () => null,
	queryEvents: async () => [],
});

const RELAYS = [
	'wss://relay.damus.io',
	'wss://relay.primal.net',
	'wss://nos.lol',
];

export function NostrProvider({ children }: { children: React.ReactNode }) {
	const [ndk, setNdk] = useState<NDK | null>(null);
	const [signer, setSigner] = useState<NDKSigner | null>(null);

	useEffect(() => {
		const ndkInstance = new NDK({
			explicitRelayUrls: RELAYS,
			enableOutboxModel: false,
		});

		ndkInstance.connect().then(() => {
			setNdk(ndkInstance);
		});

		return () => {
			ndkInstance.pool.close();
		};
	}, []);

	const publishEvent = async (event: Partial<NDKEvent>): Promise<NDKEvent | null> => {
		if (!ndk || !signer) return null;

		try {
			const ndkEvent = new NDKEvent(ndk, event);
			await ndkEvent.sign(signer);
			await ndkEvent.publish();
			return ndkEvent;
		} catch (error) {
			console.error('Failed to publish event:', error);
			return null;
		}
	};

	const queryEvents = async (filter: NDKFilter): Promise<NDKEvent[]> => {
		if (!ndk) return [];

		try {
			const events: NDKEvent[] = [];
			await ndk.fetchEvents(filter, {
				groupable: true,
				groupableDelay: 200,
			}, (event) => {
				events.push(event);
			});
			return events;
		} catch (error) {
			console.error('Failed to query events:', error);
			return [];
		}
	};

	return (
		<NostrContext.Provider
			value={{
				ndk,
				signer,
				setSigner,
				publishEvent,
				queryEvents,
			}}
		>
			{children}
		</NostrContext.Provider>
	);
}

export function useNostr() {
	return useContext(NostrContext);
} 