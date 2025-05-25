'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
	Container,
	Typography,
	Box,
	Paper,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Button,
	IconButton,
	Alert,
	CircularProgress,
	Divider
} from '@mui/material';
import {
	Add as AddIcon,
	Edit as EditIcon,
	BarChart as StatsIcon
} from '@mui/icons-material';
import { ndk, NOSTR_KINDS } from '@/lib/nostr/config';
import { useAuth } from '@/lib/auth/AuthContext';

interface Story {
	id: string;
	title: string;
	description: string;
	lifecycle: 'draft' | 'published';
	updatedAt: number;
}

interface NostrEvent {
	id: string;
	pubkey: string;
	content: string;
	created_at: number;
}

export default function WriterHub() {
	const { user, nostrPubkey } = useAuth();
	const [stories, setStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUserStories = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!user && !nostrPubkey) {
					setError('Please sign in to view your stories');
					return;
				}

				// Subscribe to user's story metadata events
				const sub = ndk.subscribe({
					kinds: [NOSTR_KINDS.STORY_METADATA],
					authors: [nostrPubkey || user?.id || '']
				});

				const fetchedStories: Story[] = [];

				sub.on('event', (event: NostrEvent) => {
					try {
						const content = JSON.parse(event.content);
						fetchedStories.push({
							id: event.id,
							title: content.title,
							description: content.description,
							lifecycle: content.lifecycle,
							updatedAt: event.created_at
						});
					} catch (e) {
						console.error('Failed to parse story:', e);
					}
				});

				// Wait for initial batch of events
				await new Promise(resolve => setTimeout(resolve, 2000));
				setStories(fetchedStories.sort((a, b) => b.updatedAt - a.updatedAt));
			} catch (err) {
				setError('Failed to load your stories. Please try again later.');
				console.error('Error fetching stories:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchUserStories();
	}, [user, nostrPubkey]);

	if (!user && !nostrPubkey) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Alert severity="warning">
					Please sign in to create and manage your stories.
				</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 4
				}}
			>
				<Typography variant="h4" component="h1">
					Your Stories
				</Typography>
				<Link href="/write/new" passHref>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						component="a"
					>
						Create New Story
					</Button>
				</Link>
			</Box>

			<Paper sx={{ mb: 4 }}>
				<Box sx={{ p: 3 }}>
					<Typography variant="h6" gutterBottom>
						Getting Started
					</Typography>
					<Typography variant="body1" paragraph>
						Create interactive stories where readers choose their path.
						Add Lightning paywalls to monetize premium chapters.
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Your stories are stored on the Nostr network and can't be
						censored or taken down.
					</Typography>
				</Box>
			</Paper>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			{loading ? (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						py: 4
					}}
				>
					<CircularProgress />
				</Box>
			) : stories.length > 0 ? (
				<Paper>
					<List>
						{stories.map((story, index) => (
							<>
								{index > 0 && <Divider />}
								<ListItem key={story.id}>
									<ListItemText
										primary={
											<Typography variant="h6">
												{story.title}
											</Typography>
										}
										secondary={
											<>
												<Typography
													variant="body2"
													color="text.secondary"
													sx={{
														mb: 1,
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient:
															'vertical',
														overflow: 'hidden'
													}}
												>
													{story.description}
												</Typography>
												<Typography
													variant="caption"
													sx={{
														display: 'inline-block',
														px: 1,
														py: 0.5,
														borderRadius: 1,
														bgcolor:
															story.lifecycle ===
															'published'
																? 'success.light'
																: 'warning.light',
														color:
															story.lifecycle ===
															'published'
																? 'success.dark'
																: 'warning.dark'
													}}
												>
													{story.lifecycle ===
													'published'
														? 'Published'
														: 'Draft'}
												</Typography>
											</>
										}
									/>
									<ListItemSecondaryAction>
										<Link
											href={`/write/${story.id}`}
											passHref
										>
											<IconButton
												edge="end"
												aria-label="edit"
												sx={{ mr: 1 }}
												component="a"
											>
												<EditIcon />
											</IconButton>
										</Link>
										<Link
											href={`/write/${story.id}/stats`}
											passHref
										>
											<IconButton
												edge="end"
												aria-label="stats"
												component="a"
											>
												<StatsIcon />
											</IconButton>
										</Link>
									</ListItemSecondaryAction>
								</ListItem>
							</>
						))}
					</List>
				</Paper>
			) : (
				<Box
					sx={{
						textAlign: 'center',
						py: 8
					}}
				>
					<Typography variant="h6" color="text.secondary" gutterBottom>
						No stories yet
					</Typography>
					<Typography color="text.secondary" paragraph>
						Create your first interactive story and share it with the
						world!
					</Typography>
					<Link href="/write/new" passHref>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							component="a"
						>
							Create New Story
						</Button>
					</Link>
				</Box>
			)}
		</Container>
	);
} 