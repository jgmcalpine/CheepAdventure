import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const supabase = createRouteHandlerClient({ cookies });

		// Check authentication
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get request body
		const { storyId, amount } = await request.json();

		if (!storyId || !amount) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Check if story exists and price matches
		const { data: story, error: storyError } = await supabase
			.from('story_metadata')
			.select('price_sats')
			.eq('id', storyId)
			.single();

		if (storyError) {
			return NextResponse.json(
				{ error: 'Story not found' },
				{ status: 404 }
			);
		}

		if (story.price_sats !== amount) {
			return NextResponse.json(
				{ error: 'Invalid amount' },
				{ status: 400 }
			);
		}

		// Generate payment hash
		const paymentHash = crypto.randomUUID();

		// Create payment record
		const { data: payment, error: paymentError } = await supabase
			.from('story_payments')
			.insert({
				story_id: storyId,
				user_id: session.user.id,
				amount_sats: amount,
				payment_hash: paymentHash,
				status: 'pending',
			})
			.select()
			.single();

		if (paymentError) {
			return NextResponse.json(
				{ error: 'Failed to create payment' },
				{ status: 500 }
			);
		}

		// TODO: Generate actual Lightning invoice using your preferred Lightning node
		// For now, we'll return a dummy invoice for development
		const invoice = `lnbc${amount}n1p3xf2sppa3fg7tkf4v9rp2cm5c8v4kr5uqxc3jygxn544usxv4c8g9e8pa4sdqqcqzzsxqyz5vqsp5usw4exj4wcfv2lg7w4ves2ime5g869z600l4gxz7xk4twkczh4uq9qyyssqy4lgd3vzv4m5nq8v7ryk79t9hzdk47h4g2dp3r9r3e2k4rsth8znfn7d9e8j2lgqvz4h8rn6nqqe3n7ked3dx7m4jq9859cpw4xzacpd4sh5m`;

		return NextResponse.json({
			invoice,
			paymentHash,
		});
	} catch (error) {
		console.error('Failed to generate invoice:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
} 