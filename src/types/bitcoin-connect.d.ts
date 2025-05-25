declare module '@getalby/bitcoin-connect-react' {
	export interface WebLNProvider {
		sendPayment(paymentRequest: string): Promise<{
			preimage: string;
		}>;
		makeInvoice(params: {
			amount: number;
			defaultMemo?: string;
		}): Promise<{
			paymentRequest: string;
		}>;
	}

	export interface BitcoinConnectConfig {
		authorizationHandler?: (params: {
			enabled: boolean;
			domain: string;
		}) => Promise<boolean>;
	}

	export function useBitcoinConnect(
		config?: BitcoinConnectConfig
	): {
		webln: WebLNProvider | null;
		enabled: boolean;
		connecting: boolean;
		connect: () => Promise<void>;
		disconnect: () => void;
	};
} 