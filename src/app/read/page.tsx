'use client';

import { useEffect, useState, ChangeEvent, SyntheticEvent } from 'react';
import {
	Container,
	Typography,
	Box,
	Grid,
	Card,
	CardContent,
	CardMedia,
	Tabs,
	Tab,
	TextField,
	InputAdornment,
	Skeleton,
	Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ndk, NOSTR_KINDS } from '@/lib/nostr/config';
import { useAuth } from '@/lib/auth/AuthContext';

interface Story {
	id: string;
	title: string;
	description: string;
	coverUrl: string;
	author: string;
	totalPrice: number;
}

interface NostrEvent {
	id: string;
	pubkey: string;
	content: string;
}

export default function ReadPage() {
	const { user, nostrPubkey } = useAuth();
	const [stories, setStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
	const [search, setSearch] = useState('');

	useEffect(() => {
		const fetchStories = async () => {
			try {
				setLoading(true);
				setError(null);

				// Subscribe to story metadata events
				const sub = ndk.subscribe({
					kinds: [NOSTR_KINDS.STORY_METADATA],
					limit: 50 // Reasonable initial limit
				});

				const fetchedStories: Story[] = [];

				sub.on('event', (event: NostrEvent) => {
					try {
						const content = JSON.parse(event.content);
						fetchedStories.push({
							id: event.id,
							title: content.title,
							description: content.description,
							coverUrl: content.cover_url || '/default-cover.jpg',
							author: event.pubkey,
							totalPrice: content.total_price || 0
						});
					} catch (e) {
						console.error('Failed to parse story:', e);
					}
				});

				// Wait for initial batch of events
				await new Promise(resolve => setTimeout(resolve, 2000));
				setStories(fetchedStories);
			} catch (err) {
				setError('Failed to load stories. Please try again later.');
				console.error('Error fetching stories:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchStories();
	}, []);

	// Filter stories based on tab and search
	const filteredStories = stories.filter((story: Story) => {
		const matchesFilter =
			filter === 'all' ||
			(filter === 'free' && story.totalPrice === 0) ||
			(filter === 'paid' && story.totalPrice > 0);

		const matchesSearch =
			search === '' ||
			story.title.toLowerCase().includes(search.toLowerCase()) ||
			story.description.toLowerCase().includes(search.toLowerCase());

		return matchesFilter && matchesSearch;
	});

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" sx={{ mb: 4 }}>
				Discover Stories
			</Typography>

			<Box sx={{ mb: 4 }}>
				<Tabs
					value={filter}
					onChange={(_: SyntheticEvent, newValue: 'all' | 'free' | 'paid') =>
						setFilter(newValue)
					}
					sx={{ mb: 3 }}
				>
					<Tab label="All Stories" value="all" />
					<Tab label="Free Stories" value="free" />
					<Tab label="Paid Stories" value="paid" />
				</Tabs>

				<TextField
					fullWidth
					placeholder="Search stories..."
					value={search}
					onChange={(e: ChangeEvent<HTMLInputElement>) =>
						setSearch(e.target.value)
					}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						)
					}}
					sx={{ mb: 3 }}
				/>

				{error && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{error}
					</Alert>
				)}

				<Grid container spacing={3}>
					{loading
						? Array.from(new Array(6)).map((_, index) => (
								<Grid item xs={12} sm={6} md={4} key={index}>
									<Card>
										<Skeleton
											variant="rectangular"
											height={200}
										/>
										<CardContent>
											<Skeleton height={32} width="60%" />
											<Skeleton height={20} width="100%" />
											<Skeleton height={20} width="80%" />
										</CardContent>
									</Card>
								</Grid>
						  ))
						: filteredStories.map((story: Story) => (
								<Grid item xs={12} sm={6} md={4} key={story.id}>
									<Card
										sx={{
											height: '100%',
											display: 'flex',
											flexDirection: 'column'
										}}
									>
										<CardMedia
											component="img"
											height="200"
											image={story.coverUrl}
											alt={story.title}
											sx={{ objectFit: 'cover' }}
										/>
										<CardContent sx={{ flexGrow: 1 }}>
											<Typography
												gutterBottom
												variant="h6"
												component="h2"
											>
												{story.title}
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{
													mb: 2,
													display: '-webkit-box',
													WebkitLineClamp: 3,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden'
												}}
											>
												{story.description}
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												{story.totalPrice > 0
													? `${story.totalPrice} sats`
													: 'Free'}
											</Typography>
										</CardContent>
									</Card>
								</Grid>
						  ))}
				</Grid>

				{!loading && filteredStories.length === 0 && (
					<Box
						sx={{
							textAlign: 'center',
							py: 8
						}}
					>
						<Typography variant="h6" color="text.secondary">
							No stories found
						</Typography>
						<Typography color="text.secondary">
							{search
								? 'Try adjusting your search terms'
								: filter === 'all'
								? 'Be the first to publish a story!'
								: `No ${filter} stories available yet`}
						</Typography>
					</Box>
				)}
			</Box>
		</Container>
	);
} 