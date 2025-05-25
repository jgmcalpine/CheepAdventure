'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
	Container,
	Typography,
	Box,
	Paper,
	TextField,
	Button,
	IconButton,
	Alert,
	CircularProgress,
	Tabs,
	Tab,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	InputAdornment
} from '@mui/material';
import {
	Save as SaveIcon,
	Add as AddIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	Publish as PublishIcon,
	ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { ndk, NOSTR_KINDS } from '@/lib/nostr/config';
import { useAuth } from '@/lib/auth/AuthContext';
import ChapterEditor from './ChapterEditor';
import StoryFlow from './StoryFlow';
import {
	publishStoryMetadata,
	publishChapterStep,
	deleteStory
} from '@/lib/nostr/events';
import { useNotification } from '@/components/Notification';

interface StoryMetadata {
	id: string;
	title: string;
	description: string;
	coverUrl: string;
	lifecycle: 'draft' | 'published';
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

interface NostrEvent {
	id: string;
	pubkey: string;
	content: string;
	created_at: number;
}

export default function StoryEditor() {
	const { storyId } = useParams<{ storyId: string }>();
	const router = useRouter();
	const { user, nostrPubkey } = useAuth();
	const { showNotification } = useNotification();
	const [activeTab, setActiveTab] = useState(0);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<StoryMetadata>({
		id: storyId === 'new' ? '' : storyId,
		title: '',
		description: '',
		coverUrl: '',
		lifecycle: 'draft'
	});
	const [steps, setSteps] = useState<ChapterStep[]>([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [chapterEditorOpen, setChapterEditorOpen] = useState(false);
	const [selectedChapter, setSelectedChapter] = useState<ChapterStep | undefined>(
		undefined
	);

	useEffect(() => {
		const fetchStoryData = async () => {
			try {
				setLoading(true);
				setError(null);

				if (storyId === 'new') {
					setLoading(false);
					return;
				}

				// Fetch story metadata
				const metadataSub = ndk.subscribe({
					kinds: [NOSTR_KINDS.STORY_METADATA],
					ids: [storyId]
				});

				const storyPromise = new Promise<StoryMetadata>((resolve, reject) => {
					metadataSub.on('event', (event: NostrEvent) => {
						try {
							const content = JSON.parse(event.content);
							resolve({
								id: event.id,
								title: content.title,
								description: content.description,
								coverUrl: content.cover_url || '',
								lifecycle: content.lifecycle || 'draft'
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
					stepsSub.on('event', (event: NostrEvent) => {
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

				setMetadata(storyData);
				setSteps(stepsData);
			} catch (err) {
				setError('Failed to load story. Please try again later.');
				console.error('Error fetching story:', err);
			} finally {
				setLoading(false);
			}
		};

		if (!user && !nostrPubkey) {
			setError('Please sign in to edit stories');
			return;
		}

		fetchStoryData();
	}, [storyId, user, nostrPubkey]);

	const handleSave = async () => {
		try {
			setSaving(true);
			setError(null);

			// Validate required fields
			if (!metadata.title.trim()) {
				setError('Title is required');
				return;
			}

			if (!metadata.description.trim()) {
				setError('Description is required');
				return;
			}

			// Publish story metadata
			const newStoryId = await publishStoryMetadata(metadata);

			// Update story ID if this is a new story
			if (storyId === 'new') {
				setMetadata({ ...metadata, id: newStoryId });
			}

			// Publish all chapter steps
			await Promise.all(
				steps.map((step) => publishChapterStep(newStoryId, step))
			);

			showNotification('Story saved successfully');

			if (storyId === 'new') {
				router.push('/write');
			}
		} catch (err) {
			setError('Failed to save story. Please try again.');
			showNotification('Failed to save story', 'error');
			console.error('Error saving story:', err);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		try {
			setLoading(true);
			setError(null);

			await deleteStory(storyId);
			showNotification('Story deleted successfully');
			router.push('/write');
		} catch (err) {
			setError('Failed to delete story. Please try again.');
			showNotification('Failed to delete story', 'error');
			console.error('Error deleting story:', err);
		} finally {
			setLoading(false);
			setDeleteDialogOpen(false);
		}
	};

	const handleSaveChapter = async (chapter: ChapterStep) => {
		try {
			// If this is a new story, save it first
			if (storyId === 'new') {
				const newStoryId = await publishStoryMetadata(metadata);
				setMetadata({ ...metadata, id: newStoryId });
			}

			// Publish chapter step
			await publishChapterStep(metadata.id, chapter);

			// Update local state
			const updatedSteps = steps.filter(
				(step) => step.stepId !== chapter.stepId
			);
			setSteps([...updatedSteps, chapter]);

			showNotification('Chapter saved successfully');
		} catch (err) {
			setError('Failed to save chapter. Please try again.');
			showNotification('Failed to save chapter', 'error');
			console.error('Error saving chapter:', err);
		}
	};

	const handleAddChapter = () => {
		setSelectedChapter(undefined);
		setChapterEditorOpen(true);
	};

	const handleEditChapter = (chapter: ChapterStep) => {
		setSelectedChapter(chapter);
		setChapterEditorOpen(true);
	};

	const handleNodeClick = (stepId: string) => {
		const chapter = steps.find((step) => step.stepId === stepId);
		if (chapter) {
			handleEditChapter(chapter);
		}
	};

	if (!user && !nostrPubkey) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<Alert severity="warning">
					Please sign in to edit stories.
				</Alert>
			</Container>
		);
	}

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
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<Link href="/write" passHref>
						<IconButton
							sx={{ mr: 2 }}
							aria-label="back"
							component="a"
						>
							<ArrowBackIcon />
						</IconButton>
					</Link>
					<Typography variant="h4" component="h1">
						{storyId === 'new' ? 'New Story' : 'Edit Story'}
					</Typography>
				</Box>
				<Box>
					{storyId !== 'new' && (
						<Button
							variant="outlined"
							color="error"
							onClick={() => setDeleteDialogOpen(true)}
							sx={{ mr: 2 }}
						>
							Delete
						</Button>
					)}
					<Button
						variant="contained"
						startIcon={<SaveIcon />}
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</Box>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			)}

			<Paper sx={{ mb: 4 }}>
				<Tabs
					value={activeTab}
					onChange={(_, newValue) => setActiveTab(newValue)}
					sx={{ borderBottom: 1, borderColor: 'divider' }}
				>
					<Tab label="Metadata" />
					<Tab label="Chapters" />
					<Tab label="Flow" />
				</Tabs>

				{activeTab === 0 && (
					<Box sx={{ p: 3 }}>
						<TextField
							fullWidth
							label="Title"
							value={metadata.title}
							onChange={(e) =>
								setMetadata({
									...metadata,
									title: e.target.value
								})
							}
							sx={{ mb: 3 }}
						/>
						<TextField
							fullWidth
							label="Description"
							value={metadata.description}
							onChange={(e) =>
								setMetadata({
									...metadata,
									description: e.target.value
								})
							}
							multiline
							rows={4}
							sx={{ mb: 3 }}
						/>
						<TextField
							fullWidth
							label="Cover Image URL"
							value={metadata.coverUrl}
							onChange={(e) =>
								setMetadata({
									...metadata,
									coverUrl: e.target.value
								})
							}
							placeholder="https://example.com/cover.jpg"
						/>
					</Box>
				)}

				{activeTab === 1 && (
					<Box sx={{ p: 3 }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								mb: 3
							}}
						>
							<Typography variant="h6">Story Chapters</Typography>
							<Button
								variant="outlined"
								startIcon={<AddIcon />}
								onClick={handleAddChapter}
							>
								Add Chapter
							</Button>
						</Box>

						{steps.length > 0 ? (
							<List>
								{steps.map((step, index) => (
									<>
										{index > 0 && <Divider />}
										<ListItem key={step.id}>
											<ListItemText
												primary={
													step.choiceText ||
													'Initial Chapter'
												}
												secondary={
													<>
														<Typography
															variant="body2"
															color="text.secondary"
															sx={{
																mb: 1,
																display:
																	'-webkit-box',
																WebkitLineClamp: 2,
																WebkitBoxOrient:
																	'vertical',
																overflow:
																	'hidden'
															}}
														>
															{step.content}
														</Typography>
														{step.price > 0 && (
															<Typography
																variant="caption"
																sx={{
																	display:
																		'inline-block',
																	px: 1,
																	py: 0.5,
																	borderRadius: 1,
																	bgcolor:
																		'primary.light',
																	color: 'primary.dark'
																}}
															>
																{step.price} sats
															</Typography>
														)}
													</>
												}
											/>
											<ListItemSecondaryAction>
												<IconButton
													edge="end"
													aria-label="edit"
													onClick={() =>
														handleEditChapter(step)
													}
												>
													<EditIcon />
												</IconButton>
											</ListItemSecondaryAction>
										</ListItem>
									</>
								))}
							</List>
						) : (
							<Box
								sx={{
									textAlign: 'center',
									py: 8
								}}
							>
								<Typography
									variant="h6"
									color="text.secondary"
									gutterBottom
								>
									No chapters yet
								</Typography>
								<Typography
									color="text.secondary"
									paragraph
								>
									Start by adding your first chapter
								</Typography>
								<Button
									variant="contained"
									startIcon={<AddIcon />}
									onClick={handleAddChapter}
								>
									Add First Chapter
								</Button>
							</Box>
						)}
					</Box>
				)}

				{activeTab === 2 && (
					<Box sx={{ p: 3 }}>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								mb: 3
							}}
						>
							<Typography variant="h6">Story Flow</Typography>
							<Button
								variant="outlined"
								startIcon={<AddIcon />}
								onClick={handleAddChapter}
							>
								Add Chapter
							</Button>
						</Box>

						{steps.length > 0 ? (
							<StoryFlow steps={steps} onNodeClick={handleNodeClick} />
						) : (
							<Box
								sx={{
									textAlign: 'center',
									py: 8
								}}
							>
								<Typography
									variant="h6"
									color="text.secondary"
									gutterBottom
								>
									No chapters yet
								</Typography>
								<Typography color="text.secondary" paragraph>
									Start by adding your first chapter to visualize the
									story flow
								</Typography>
								<Button
									variant="contained"
									startIcon={<AddIcon />}
									onClick={handleAddChapter}
								>
									Add First Chapter
								</Button>
							</Box>
						)}
					</Box>
				)}
			</Paper>

			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Story</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this story? This action
						cannot be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleDelete}
						color="error"
						variant="contained"
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			<ChapterEditor
				open={chapterEditorOpen}
				onClose={() => setChapterEditorOpen(false)}
				onSave={handleSaveChapter}
				chapter={selectedChapter}
				availableParents={steps.filter(
					(step) => !step.isEndStep && step.stepId !== selectedChapter?.stepId
				)}
			/>
		</Container>
	);
} 