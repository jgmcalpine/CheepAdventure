'use client';

import { useState, useEffect } from 'react';
import { Typography, Button, Box, Paper, CircularProgress, Alert } from '@mui/material';
import { useNostr } from '../providers/NostrProvider';
import { useLightning } from '../providers/LightningProvider';
import { useAuth } from '../providers/AuthProvider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Choice {
	text: string;
	nextChapterId: string;
}

interface Chapter {
	id: string;
	title: string;
	content: string;
	choices: Choice[];
}

interface StoryReaderProps {
	storyId: string;
	initialChapterId: string;
}

export function StoryReader({ storyId, initialChapterId }: StoryReaderProps) {
	const supabase = createClientComponentClient();
	const { queryEvents } = useNostr();
	const { requestPayment } = useLightning();
	const { user } = useAuth();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [chapter, setChapter] = useState<Chapter | null>(null);
	const [paymentRequired, setPaymentRequired] = useState(false);

	useEffect(() => {
		loadChapter(initialChapterId);
	}, [initialChapterId]);

	const loadChapter = async (chapterId: string) => {
		try {
			setLoading(true);
			setError(null);

			// Check if story requires payment
			const { data: storyData, error: storyError } = await supabase
				.from('story_metadata')
				.select('price_sats')
				.eq('id', storyId)
				.single();

			if (storyError) throw storyError;

			if (storyData.price_sats > 0) {
				// Check if user has paid
				const { data: paymentData, error: paymentError } = await supabase
					.from('story_payments')
					.select('status')
					.eq('story_id', storyId)
					.eq('user_id', user?.id)
					.eq('status', 'completed')
					.single();

				if (paymentError && paymentError.code !== 'PGRST116') {
					throw paymentError;
				}

				if (!paymentData) {
					setPaymentRequired(true);
					return;
				}
			}

			// Fetch chapter from Nostr
			const events = await queryEvents({
				kinds: [30078],
				'#e': [chapterId],
			});

			if (events.length === 0) {
				throw new Error('Chapter not found');
			}

			const event = events[0];
			const content = JSON.parse(event.content);

			setChapter({
				id: event.id,
				title: content.title,
				content: content.content,
				choices: content.choices || [],
			});
		} catch (err) {
			console.error('Failed to load chapter:', err);
			setError('Failed to load chapter. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handlePayment = async () => {
		try {
			setLoading(true);
			setError(null);

			// Get story price
			const { data: storyData, error: storyError } = await supabase
				.from('story_metadata')
				.select('price_sats')
				.eq('id', storyId)
				.single();

			if (storyError) throw storyError;

			// Generate invoice
			const response = await fetch('/api/lightning/invoice', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					storyId,
					amount: storyData.price_sats,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to generate invoice');
			}

			const { invoice, paymentHash } = await response.json();

			// Process payment
			const { preimage } = await requestPayment(invoice);

			// Update payment status
			const { error: updateError } = await supabase
				.from('story_payments')
				.update({
					status: 'completed',
					payment_preimage: preimage,
				})
				.eq('payment_hash', paymentHash);

			if (updateError) throw updateError;

			setPaymentRequired(false);
			loadChapter(initialChapterId);
		} catch (err) {
			console.error('Payment failed:', err);
			setError('Payment failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Box className="flex justify-center items-center min-h-[400px]">
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" className="mb-4">
				{error}
			</Alert>
		);
	}

	if (paymentRequired) {
		return (
			<Paper className="p-6 text-center">
				<Typography variant="h6" className="mb-4">
					This story requires payment to read
				</Typography>
				<Button
					variant="contained"
					color="primary"
					onClick={handlePayment}
					disabled={loading}
				>
					{loading ? 'Processing...' : 'Pay with Lightning'}
				</Button>
			</Paper>
		);
	}

	if (!chapter) {
		return null;
	}

	return (
		<Paper className="p-6">
			<Typography variant="h4" className="mb-6">
				{chapter.title}
			</Typography>
			<Typography className="mb-8 whitespace-pre-wrap">{chapter.content}</Typography>
			{chapter.choices.length > 0 && (
				<Box className="space-y-4">
					<Typography variant="h6" className="mb-4">
						What will you do?
					</Typography>
					{chapter.choices.map((choice) => (
						<Button
							key={choice.nextChapterId}
							variant="outlined"
							fullWidth
							onClick={() => loadChapter(choice.nextChapterId)}
							className="text-left normal-case"
						>
							{choice.text}
						</Button>
					))}
				</Box>
			)}
		</Paper>
	);
} 