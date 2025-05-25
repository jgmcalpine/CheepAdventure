'use client';

import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormControlLabel,
	Switch,
	Box,
	Typography,
	InputAdornment,
	Alert
} from '@mui/material';
import { Editor } from '@monaco-editor/react';

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

interface ChapterEditorProps {
	open: boolean;
	onClose: () => void;
	onSave: (chapter: ChapterStep) => Promise<void>;
	chapter?: ChapterStep;
	availableParents: ChapterStep[];
}

export default function ChapterEditor({
	open,
	onClose,
	onSave,
	chapter,
	availableParents
}: ChapterEditorProps) {
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<ChapterStep>({
		id: '',
		stepId: '',
		parentStepId: null,
		choiceText: '',
		price: 0,
		contentType: 'markdown',
		content: '',
		isEndStep: false
	});

	useEffect(() => {
		if (chapter) {
			setFormData(chapter);
		} else {
			setFormData({
				id: '',
				stepId: crypto.randomUUID(),
				parentStepId: null,
				choiceText: '',
				price: 0,
				contentType: 'markdown',
				content: '',
				isEndStep: false
			});
		}
	}, [chapter]);

	const handleSave = async () => {
		try {
			setSaving(true);
			setError(null);

			if (!formData.content.trim()) {
				setError('Chapter content is required');
				return;
			}

			if (formData.parentStepId && !formData.choiceText?.trim()) {
				setError('Choice text is required for non-initial chapters');
				return;
			}

			await onSave(formData);
			onClose();
		} catch (err) {
			setError('Failed to save chapter. Please try again.');
			console.error('Error saving chapter:', err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				{chapter ? 'Edit Chapter' : 'New Chapter'}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ mb: 3 }}>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<FormControl fullWidth sx={{ mb: 2 }}>
						<InputLabel>Parent Chapter</InputLabel>
						<Select
							value={formData.parentStepId || ''}
							onChange={(e) =>
								setFormData({
									...formData,
									parentStepId: e.target.value || null
								})
							}
							disabled={!availableParents.length}
						>
							<MenuItem value="">Initial Chapter</MenuItem>
							{availableParents.map((parent) => (
								<MenuItem
									key={parent.stepId}
									value={parent.stepId}
								>
									{parent.choiceText || 'Initial Chapter'}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{formData.parentStepId && (
						<TextField
							fullWidth
							label="Choice Text"
							value={formData.choiceText || ''}
							onChange={(e) =>
								setFormData({
									...formData,
									choiceText: e.target.value
								})
							}
							placeholder="What choice leads to this chapter?"
							sx={{ mb: 2 }}
						/>
					)}

					<Box sx={{ mb: 2 }}>
						<Typography
							variant="subtitle2"
							color="text.secondary"
							gutterBottom
						>
							Chapter Content (Markdown)
						</Typography>
						<Editor
							height="300px"
							defaultLanguage="markdown"
							value={formData.content}
							onChange={(value) =>
								setFormData({
									...formData,
									content: value || ''
								})
							}
							options={{
								minimap: { enabled: false },
								wordWrap: 'on'
							}}
						/>
					</Box>

					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							mb: 2
						}}
					>
						<TextField
							type="number"
							label="Price"
							value={formData.price}
							onChange={(e) =>
								setFormData({
									...formData,
									price: Math.max(
										0,
										parseInt(e.target.value) || 0
									)
								})
							}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										sats
									</InputAdornment>
								)
							}}
							sx={{ width: 150 }}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={formData.isEndStep}
									onChange={(e) =>
										setFormData({
											...formData,
											isEndStep: e.target.checked
										})
									}
								/>
							}
							label="End Chapter"
						/>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					disabled={saving}
				>
					{saving ? 'Saving...' : 'Save'}
				</Button>
			</DialogActions>
		</Dialog>
	);
} 