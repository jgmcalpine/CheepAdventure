'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
	Stepper,
	Step,
	StepLabel,
	Paper
} from '@mui/material';
import { useBitcoinConnect } from '@getalby/bitcoin-connect-react';
import { ndk, NOSTR_KINDS } from '@/lib/nostr/config';
import { useAuth } from '@/lib/auth/AuthContext';
import { makePayment, PaymentResult } from '@/lib/lightning/config';

interface StoryMetadata {
	id: string;
	title: string;
	description: string;
	coverUrl: string;
	author: string;
	totalPrice: number;
}

interface ChapterStep {
	id: string;
	stepId: string;
	parentStepId: string | null;
	choiceText: string | null;
	price: number;
	contentType: 'text' | 'markdown' | 'html' | 'image' | 'video';
	content: string;
	isEndStep: boolean;
}

interface PaywallDialogProps {
	open: boolean;
	onClose: () => void;
	price: number;
	onPaymentComplete: (result: PaymentResult) => void;
}

function PaywallDialog({
	open,
	onClose,
	price,
	onPaymentComplete
}: PaywallDialogProps) {
	const { webln, enabled, connect } = useBitcoinConnect();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handlePayment = async () => {
		try {
			setLoading(true);
			setError(null);

			if (!webln) {
				await connect();
				return;
			}

			// In a real implementation, we would:
			// 1. Call our backend to generate a Lightning invoice
			// 2. Send payment via WebLN
			// 3. Verify payment on backend
			// 4. Return payment proof
			// For now, we'll simulate this:
			const result = await makePayment(webln, 'dummy_invoice');
			onPaymentComplete(result);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to process payment'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Unlock Chapter</DialogTitle>
			<DialogContent>
				<Typography gutterBottom>
					This chapter costs {price} sats to unlock.
				</Typography>
				{error && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					onClick={handlePayment}
					disabled={loading}
					variant="contained"
				>
					{loading ? (
						<CircularProgress size={24} />
					) : enabled ? (
						`Pay ${price} sats`
					) : (
						'Connect Wallet'
					)}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default function StoryReader() {
	const { storyId } = useParams<{ storyId: string }>();
	const { user, nostrPubkey } = useAuth();
	const [story, setStory] = useState<StoryMetadata | null>(null);
	const [currentStep, setCurrentStep] = useState<ChapterStep | null>(null);
	const [steps, setSteps] = useState<ChapterStep[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [paywallOpen, setPaywallOpen] = useState(false);

	useEffect(() => {
		const fetchStory = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch story metadata
				const metadataSub = ndk.subscribe({
					kinds: [NOSTR_KINDS.STORY_METADATA],
					ids: [storyId]
				});

				const storyPromise = new Promise<StoryMetadata>((resolve, reject) => {
					metadataSub.on('event', (event: any) => {
						try {
							const content = JSON.parse(event.content);
							resolve({
								id: event.id,
								title: content.title,
								description: content.description,
								coverUrl: content.cover_url || '/default-cover.jpg',
								author: event.pubkey,
								totalPrice: content.total_price || 0
							});
						} catch (e) {
							reject(e);
						}
					});
				});

				// Fetch chapter steps
				const stepsSub = ndk.subscribe({
					kinds: [NOSTR_KINDS.CHAPTER_STEP],
					'#e': [storyId]
				});

				const stepsPromise = new Promise<ChapterStep[]>((resolve) => {
					const fetchedSteps: ChapterStep[] = [];
					stepsSub.on('event', (event: any) => {
						try {
							const content = JSON.parse(event.content);
							fetchedSteps.push({
								id: event.id,
								stepId: content.step_id,
								parentStepId: content.parent_step_id,
								choiceText: content.choice_text,
								price: content.price || 0,
								contentType: content.content_type,
								content: content.content,
								isEndStep: content.is_end_step || false
							});
						} catch (e) {
							console.error('Failed to parse step:', e);
						}
					});

					// Wait for initial batch of events
					setTimeout(() => resolve(fetchedSteps), 2000);
				});

				const [storyData, stepsData] = await Promise.all([
					storyPromise,
					stepsPromise
				]);

				setStory(storyData);
				setSteps(stepsData);

				// Set initial step
				const initialStep = stepsData.find(
					(step) => step.parentStepId === null
				);
				if (initialStep) {
					setCurrentStep(initialStep);
				}
			} catch (err) {
				setError('Failed to load story. Please try again later.');
				console.error('Error fetching story:', err);
			} finally {
				setLoading(false);
			}
		};

		if (storyId) {
			fetchStory();
		}
	}, [storyId]);

	const handleChoice = (step: ChapterStep) => {
		if (step.price > 0) {
			setPaywallOpen(true);
		} else {
			setCurrentStep(step);
		}
	};

	const handlePaymentComplete = (result: PaymentResult) => {
		// In a real implementation, we would:
		// 1. Verify the payment proof
		// 2. Decrypt the content
		// 3. Store the payment proof in Nostr and Postgres
		setPaywallOpen(false);
		if (currentStep) {
			setCurrentStep(currentStep);
		}
	};

	if (loading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '50vh'
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !story) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Alert severity="error">{error || 'Story not found'}</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box sx={{ mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					{story.title}
				</Typography>
				<Typography variant="subtitle1" color="text.secondary" gutterBottom>
					by {story.author}
				</Typography>
				<Typography variant="body1">{story.description}</Typography>
			</Box>

			{currentStep && (
				<Paper sx={{ p: 4, mb: 4 }}>
					<Typography variant="body1" sx={{ mb: 3 }}>
						{currentStep.content}
					</Typography>

					{!currentStep.isEndStep && (
						<Box sx={{ mt: 4 }}>
							<Typography variant="h6" gutterBottom>
								What happens next?
							</Typography>
							<Box
								sx={{
									display: 'grid',
									gap: 2,
									gridTemplateColumns: {
										xs: '1fr',
										sm: 'repeat(auto-fit, minmax(200px, 1fr))'
									}
								}}
							>
								{steps
									.filter(
										(step) =>
											step.parentStepId === currentStep.stepId
									)
									.map((step) => (
										<Button
											key={step.id}
											variant="outlined"
											onClick={() => handleChoice(step)}
											startIcon={
												step.price > 0 ? (
													<span>⚡</span>
												) : null
											}
										>
											{step.choiceText}{' '}
											{step.price > 0 &&
												`(${step.price} sats)`}
										</Button>
									))}
							</Box>
						</Box>
					)}
				</Paper>
			)}

			<PaywallDialog
				open={paywallOpen}
				onClose={() => setPaywallOpen(false)}
				price={currentStep?.price || 0}
				onPaymentComplete={handlePaymentComplete}
			/>
		</Container>
	);
} 