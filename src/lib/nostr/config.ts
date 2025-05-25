import NDK from '@nostr-dev-kit/ndk';

export const RELAYS = [
	'wss://relay.damus.io',
	'wss://relay.primal.net',
	'wss://nos.lol'
];

export const NOSTR_KINDS = {
	STORY_METADATA: 30077,
	CHAPTER_STEP: 30078,
	PAYMENT_PROOF: 30079,
	COMPLETION_BADGE: 30080
} as const;

// Initialize NDK with our relay pool
export const ndk = new NDK({
	explicitRelayUrls: RELAYS,
	enableOutboxModel: false // We'll handle event publishing directly
});

// Initialize NDK
export const initializeNDK = async () => {
	try {
		await ndk.connect();
		console.log('Connected to Nostr network');
	} catch (error) {
		console.error('Failed to connect to Nostr network:', error);
		throw error;
	}
};

// Check if window.nostr is available (NIP-07)
export const hasNostrExtension = (): boolean => {
	return typeof window !== 'undefined' && 'nostr' in window;
};

// Get the user's public key from their Nostr extension
export const getPublicKey = async (): Promise<string | null> => {
	if (!hasNostrExtension()) {
		return null;
	}

	try {
		return await window.nostr.getPublicKey();
	} catch (error) {
		console.error('Failed to get public key:', error);
		return null;
	}
};

// Sign an event using the user's Nostr extension
export const signEvent = async (
	kind: number,
	content: string,
	tags: string[][] = []
): Promise<any | null> => {
	if (!hasNostrExtension()) {
		return null;
	}

	try {
		const pubkey = await getPublicKey();
		if (!pubkey) return null;

		const event = {
			kind,
			pubkey,
			created_at: Math.floor(Date.now() / 1000),
			tags,
			content
		};

		return await window.nostr.signEvent(event);
	} catch (error) {
		console.error('Failed to sign event:', error);
		return null;
	}
};

// Publish an event to all configured relays
export const publishEvent = async (event: any): Promise<boolean> => {
	try {
		const pub = ndk.publish(event);
		await pub.onFirstOkOrCompleted();
		return true;
	} catch (error) {
		console.error('Failed to publish event:', error);
		return false;
	}
};

// Subscribe to events of a specific kind
export const subscribeToEvents = (
	kinds: number[],
	filters: any = {},
	onEvent: (event: any) => void
) => {
	const sub = ndk.subscribe({ kinds, ...filters });
	
	sub.on('event', (event: any) => {
		onEvent(event);
	});

	return sub;
}; 