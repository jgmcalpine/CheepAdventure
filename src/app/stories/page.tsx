import { Suspense } from 'react';
import { Typography, Box, Grid, CircularProgress } from '@mui/material';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StoryCard } from '@/components/story/StoryCard';

async function StoryList() {
	const supabase = createServerComponentClient({ cookies });

	const { data: stories, error } = await supabase
		.from('story_metadata')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading stories:', error);
		return (
			<Box className="p-4">
				<Typography color="error">Failed to load stories. Please try again.</Typography>
			</Box>
		);
	}

	if (!stories?.length) {
		return (
			<Box className="p-4">
				<Typography>No stories found. Be the first to create one!</Typography>
			</Box>
		);
	}

	return (
		<Grid container spacing={4}>
			{stories.map((story) => (
				<Grid item key={story.id} xs={12} sm={6} md={4}>
					<StoryCard
						id={story.id}
						title={story.title}
						description={story.description}
						coverImageUrl={story.cover_image_url}
						authorPubkey={story.author_pubkey}
						priceSats={story.price_sats}
						createdAt={story.created_at}
					/>
				</Grid>
			))}
		</Grid>
	);
}

export default function StoriesPage() {
	return (
		<Box className="container mx-auto px-4 py-8">
			<Typography variant="h4" component="h1" className="mb-8">
				Interactive Stories
			</Typography>
			<Suspense
				fallback={
					<Box className="flex justify-center items-center min-h-[400px]">
						<CircularProgress />
					</Box>
				}
			>
				<StoryList />
			</Suspense>
		</Box>
	);
} 