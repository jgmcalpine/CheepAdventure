import { Box, Typography } from '@mui/material';
import { StoryEditor } from '@/components/story/StoryEditor';

export default function CreateStoryPage() {
	return (
		<Box className="container mx-auto px-4 py-8">
			<Typography variant="h4" component="h1" className="mb-8">
				Create New Story
			</Typography>
			<StoryEditor />
		</Box>
	);
} 