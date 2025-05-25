import { Suspense } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { StoryReader } from '@/components/story/StoryReader';

interface StoryPageProps {
	params: {
		id: string;
	};
}

async function StoryContent({ id }: { id: string }) {
	const supabase = createServerComponentClient({ cookies });

	const { data: story, error } = await supabase
		.from('story_metadata')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		console.error('Error loading story:', error);
		return (
			<Box className="p-4">
				<Typography color="error">Failed to load story. Please try again.</Typography>
			</Box>
		);
	}

	const { data: firstChapter, error: chapterError } = await supabase
		.from('story_chapters')
		.select('nostr_event_id')
		.eq('story_id', id)
		.eq('chapter_number', 1)
		.single();

	if (chapterError) {
		console.error('Error loading first chapter:', chapterError);
		return (
			<Box className="p-4">
				<Typography color="error">Failed to load story chapter. Please try again.</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box className="mb-8">
				<Typography variant="h4" component="h1" className="mb-2">
					{story.title}
				</Typography>
				{story.description && (
					<Typography variant="body1" color="text.secondary" className="mb-4">
						{story.description}
					</Typography>
				)}
			</Box>
			<StoryReader storyId={id} initialChapterId={firstChapter.nostr_event_id} />
		</Box>
	);
}

export default function StoryPage({ params }: StoryPageProps) {
	return (
		<Box className="container mx-auto px-4 py-8">
			<Suspense
				fallback={
					<Box className="flex justify-center items-center min-h-[400px]">
						<CircularProgress />
					</Box>
				}
			>
				<StoryContent id={params.id} />
			</Suspense>
		</Box>
	);
} 