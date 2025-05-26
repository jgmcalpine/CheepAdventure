'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	IconButton,
	Alert,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNostr } from '../providers/NostrProvider';
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

interface StoryEditorProps {
	storyId?: string;
}

export function StoryEditor({ storyId }: StoryEditorProps) {
	const supabase = createClientComponentClient();
	const { publishEvent, queryEvents } = useNostr();
	const { user, nostrUser } = useAuth();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [coverImageUrl, setCoverImageUrl] = useState('');
	const [priceSats, setPriceSats] = useState(0);
	const [chapters, setChapters] = useState<Chapter[]>([]);
	const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
	const [showChapterDialog, setShowChapterDialog] = useState(false);

	useEffect(() => {
		if (storyId) {
			loadStory();
		}
	}, [storyId]);

	const loadStory = async () => {
		try {
			setLoading(true);
			setError(null);

			// Load story metadata from Supabase
			const { data: storyData, error: storyError } = await supabase
				.from('story_metadata')
				.select('*')
				.eq('id', storyId)
				.single();

			if (storyError) throw storyError;

			setTitle(storyData.title);
			setDescription(storyData.description || '');
			setCoverImageUrl(storyData.cover_image_url || '');
			setPriceSats(storyData.price_sats);

			// Load chapters from Nostr
			const { data: chaptersData, error: chaptersError } = await supabase
				.from('story_chapters')
				.select('nostr_event_id')
				.eq('story_id', storyId)
				.order('chapter_number', { ascending: true });

			if (chaptersError) throw chaptersError;

			const loadedChapters: Chapter[] = [];
			for (const chapter of chaptersData) {
				const events = await queryEvents({
					kinds: [30078],
					ids: [chapter.nostr_event_id],
				});

				if (events.length > 0) {
					const event = events[0];
					const content = JSON.parse(event.content);
					loadedChapters.push({
						id: event.id,
						title: content.title,
						content: content.content,
						choices: content.choices || [],
					});
				}
			}

			setChapters(loadedChapters);
		} catch (err) {
			console.error('Failed to load story:', err);
			setError('Failed to load story. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		try {
			setLoading(true);
			setError(null);
			setSuccess(false);

			if (!nostrUser) {
				throw new Error('No Nostr user available');
			}

			// Publish story metadata to Nostr
			const metadataEvent = await publishEvent({
				kind: 30077,
				content: JSON.stringify({
					title,
					description,
					coverImageUrl,
					priceSats,
				}),
				tags: [
					['t', 'story'],
					['price', priceSats.toString()],
				],
			});

			if (!metadataEvent) {
				throw new Error('Failed to publish story metadata');
			}

			// Save story metadata to Supabase
			const { data: storyData, error: storyError } = await supabase
				.from('story_metadata')
				.upsert({
					id: storyId,
					nostr_event_id: metadataEvent.id,
					author_pubkey: nostrUser.pubkey,
					title,
					description,
					cover_image_url: coverImageUrl,
					price_sats: priceSats,
				})
				.select()
				.single();

			if (storyError) throw storyError;

			// Publish chapters to Nostr and save to Supabase
			for (let i = 0; i < chapters.length; i++) {
				const chapter = chapters[i];
				const chapterEvent = await publishEvent({
					kind: 30078,
					content: JSON.stringify({
						title: chapter.title,
						content: chapter.content,
						choices: chapter.choices,
					}),
					tags: [
						['e', metadataEvent.id],
						['chapter', (i + 1).toString()],
					],
				});

				if (!chapterEvent) {
					throw new Error(`Failed to publish chapter ${i + 1}`);
				}

				const { error: chapterError } = await supabase.from('story_chapters').upsert({
					story_id: storyData.id,
					nostr_event_id: chapterEvent.id,
					chapter_number: i + 1,
					title: chapter.title,
					content: chapter.content,
					choices: chapter.choices,
				});

				if (chapterError) throw chapterError;
			}

			setSuccess(true);
		} catch (err) {
			console.error('Failed to save story:', err);
			setError('Failed to save story. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleAddChapter = () => {
		setSelectedChapter({
			id: '',
			title: '',
			content: '',
			choices: [],
		});
		setShowChapterDialog(true);
	};

	const handleEditChapter = (chapter: Chapter) => {
		setSelectedChapter(chapter);
		setShowChapterDialog(true);
	};

	const handleSaveChapter = () => {
		if (!selectedChapter) return;

		const newChapters = [...chapters];
		const index = chapters.findIndex((c) => c.id === selectedChapter.id);

		if (index === -1) {
			newChapters.push(selectedChapter);
		} else {
			newChapters[index] = selectedChapter;
		}

		setChapters(newChapters);
		setShowChapterDialog(false);
		setSelectedChapter(null);
	};

	const handleDeleteChapter = (chapterId: string) => {
		setChapters(chapters.filter((c) => c.id !== chapterId));
	};

	if (loading) {
		return (
			<Box className="flex justify-center items-center min-h-[400px]">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box className="space-y-6">
			{error && (
				<Alert severity="error" className="mb-4">
					{error}
				</Alert>
			)}
			{success && (
				<Alert severity="success" className="mb-4">
					Story saved successfully!
				</Alert>
			)}

			<Paper className="p-6">
				<Typography variant="h5" className="mb-6">
					Story Details
				</Typography>
				<Box className="space-y-4">
					<TextField
						label="Title"
						fullWidth
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
					<TextField
						label="Description"
						fullWidth
						multiline
						rows={3}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
					<TextField
						label="Cover Image URL"
						fullWidth
						value={coverImageUrl}
						onChange={(e) => setCoverImageUrl(e.target.value)}
					/>
					<TextField
						label="Price (sats)"
						type="number"
						fullWidth
						value={priceSats}
						onChange={(e) => setPriceSats(parseInt(e.target.value) || 0)}
					/>
				</Box>
			</Paper>

			<Paper className="p-6">
				<Box className="flex justify-between items-center mb-6">
					<Typography variant="h5">Chapters</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={handleAddChapter}
					>
						Add Chapter
					</Button>
				</Box>

				<Box className="space-y-4">
					{chapters.map((chapter, index) => (
						<Paper key={chapter.id || index} className="p-4 border">
							<Box className="flex justify-between items-start">
								<Box>
									<Typography variant="h6">{chapter.title}</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										className="line-clamp-2"
									>
										{chapter.content}
									</Typography>
								</Box>
								<Box>
									<IconButton
										size="small"
										onClick={() => handleEditChapter(chapter)}
									>
										<EditIcon />
									</IconButton>
									<IconButton
										size="small"
										color="error"
										onClick={() => handleDeleteChapter(chapter.id)}
									>
										<DeleteIcon />
									</IconButton>
								</Box>
							</Box>
						</Paper>
					))}
				</Box>
			</Paper>

			<Box className="flex justify-end">
				<Button
					variant="contained"
					size="large"
					onClick={handleSave}
					disabled={loading}
				>
					{loading ? 'Saving...' : 'Save Story'}
				</Button>
			</Box>

			<Dialog
				open={showChapterDialog}
				onClose={() => setShowChapterDialog(false)}
				maxWidth="md"
				fullWidth
			>
				<DialogTitle>
					{selectedChapter?.id ? 'Edit Chapter' : 'Add Chapter'}
				</DialogTitle>
				<DialogContent>
					<Box className="space-y-4 pt-4">
						<TextField
							label="Title"
							fullWidth
							value={selectedChapter?.title || ''}
							onChange={(e) =>
								setSelectedChapter((prev) =>
									prev ? { ...prev, title: e.target.value } : null
								)
							}
						/>
						<TextField
							label="Content"
							fullWidth
							multiline
							rows={6}
							value={selectedChapter?.content || ''}
							onChange={(e) =>
								setSelectedChapter((prev) =>
									prev ? { ...prev, content: e.target.value } : null
								)
							}
						/>
						<Typography variant="h6" className="mt-4">
							Choices
						</Typography>
						{selectedChapter?.choices.map((choice, index) => (
							<Box key={index} className="flex gap-4">
								<TextField
									label="Choice Text"
									fullWidth
									value={choice.text}
									onChange={(e) => {
										const newChoices = [...(selectedChapter?.choices || [])];
										newChoices[index] = {
											...newChoices[index],
											text: e.target.value,
										};
										setSelectedChapter((prev) =>
											prev ? { ...prev, choices: newChoices } : null
										);
									}}
								/>
								<TextField
									label="Next Chapter ID"
									fullWidth
									value={choice.nextChapterId}
									onChange={(e) => {
										const newChoices = [...(selectedChapter?.choices || [])];
										newChoices[index] = {
											...newChoices[index],
											nextChapterId: e.target.value,
										};
										setSelectedChapter((prev) =>
											prev ? { ...prev, choices: newChoices } : null
										);
									}}
								/>
								<IconButton
									color="error"
									onClick={() => {
										const newChoices = selectedChapter?.choices.filter(
											(_, i) => i !== index
										);
										setSelectedChapter((prev) =>
											prev ? { ...prev, choices: newChoices } : null
										);
									}}
								>
									<DeleteIcon />
								</IconButton>
							</Box>
						))}
						<Button
							startIcon={<AddIcon />}
							onClick={() => {
								const newChoices = [
									...(selectedChapter?.choices || []),
									{ text: '', nextChapterId: '' },
								];
								setSelectedChapter((prev) =>
									prev ? { ...prev, choices: newChoices } : null
								);
							}}
						>
							Add Choice
						</Button>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowChapterDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleSaveChapter}>
						Save Chapter
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
} 