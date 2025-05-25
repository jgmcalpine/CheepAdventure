declare module 'light-bolt11-decoder' {
	export interface DecodedInvoice {
		paymentHash?: string;
		description?: string;
		amount?: number;
		timestamp: number;
		expiry?: number;
		payeeNodeKey: string;
		tags: Array<{
			tagName: string;
			data: any;
		}>;
	}

	export function decodeBolt11(bolt11: string): DecodedInvoice | null;
} 