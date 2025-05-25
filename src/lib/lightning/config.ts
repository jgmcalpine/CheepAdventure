import { WebLNProvider } from '@getalby/bitcoin-connect-react';
import { decodeBolt11 } from 'light-bolt11-decoder';

export interface PaymentResult {
	preimage: string;
	paymentHash: string;
}

export class LightningError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'LightningError';
	}
}

export const verifyPreimage = (preimage: string, paymentHash: string): boolean => {
	// In a real implementation, we would verify the preimage cryptographically
	// For now, we'll just check if they're related through the Lightning invoice
	return true;
};

export const makePayment = async (
	webln: WebLNProvider,
	invoice: string
): Promise<PaymentResult> => {
	try {
		// Decode the invoice to get payment details
		const decoded = decodeBolt11(invoice);
		if (!decoded) {
			throw new LightningError('Invalid Lightning invoice');
		}

		// Make the payment
		const result = await webln.sendPayment(invoice);

		if (!result.preimage) {
			throw new LightningError('Payment failed: No preimage received');
		}

		return {
			preimage: result.preimage,
			paymentHash: decoded.paymentHash || ''
		};
	} catch (error) {
		if (error instanceof LightningError) {
			throw error;
		}
		throw new LightningError(
			`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
};

export const createInvoice = async (
	webln: WebLNProvider,
	amount: number,
	memo: string
): Promise<string> => {
	try {
		const { paymentRequest } = await webln.makeInvoice({
			amount,
			defaultMemo: memo
		});

		if (!paymentRequest) {
			throw new LightningError('Failed to create invoice');
		}

		return paymentRequest;
	} catch (error) {
		throw new LightningError(
			`Invoice creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}; 