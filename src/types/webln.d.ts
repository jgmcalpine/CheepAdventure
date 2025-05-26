import type { WebLNProvider } from '@webbtc/webln-types';

declare global {
	interface Window {
		webln?: WebLNProvider;
	}
} 