'use client';

import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryCardProps {
	id: string;
	title: string;
	description?: string;
	coverImageUrl?: string;
	authorPubkey: string;
	priceSats: number;
	createdAt: string;
}

export function StoryCard({
	id,
	title,
	description,
	coverImageUrl,
	authorPubkey,
	priceSats,
	createdAt,
}: StoryCardProps) {
	return (
		<Card className="w-full max-w-sm hover:shadow-lg transition-shadow duration-200">
			{coverImageUrl && (
				<CardMedia
					component="img"
					height="140"
					image={coverImageUrl}
					alt={title}
					className="h-36 object-cover"
				/>
			)}
			<CardContent className="p-4">
				<Box className="flex justify-between items-start mb-2">
					<Typography variant="h6" component="h2" className="font-bold">
						{title}
					</Typography>
					{priceSats > 0 && (
						<Chip
							label={`${priceSats} sats`}
							color="primary"
							size="small"
							className="ml-2"
						/>
					)}
				</Box>
				{description && (
					<Typography
						variant="body2"
						color="text.secondary"
						className="mb-3 line-clamp-2"
					>
						{description}
					</Typography>
				)}
				<Box className="flex justify-between items-center mt-4">
					<Typography variant="caption" color="text.secondary">
						{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
					</Typography>
					<Button
						component={Link}
						href={`/story/${id}`}
						variant="contained"
						size="small"
					>
						Read Story
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
} 