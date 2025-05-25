import { ndk, NOSTR_KINDS } from './config';

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

export async function publishStoryMetadata(
	metadata: StoryMetadata
): Promise<string> {
	try {
		const event = await ndk.publish({
			kind: NOSTR_KINDS.STORY_METADATA,
			content: JSON.stringify({
				title: metadata.title,
				description: metadata.description,
				cover_url: metadata.coverUrl,
				lifecycle: metadata.lifecycle
			}),
			tags: [['t', 'story'], ['t', 'metadata']]
		});

		return event.id;
	} catch (err) {
		console.error('Failed to publish story metadata:', err);
		throw new Error('Failed to publish story metadata');
	}
}

export async function publishChapterStep(
	storyId: string,
	step: ChapterStep
): Promise<string> {
	try {
		const event = await ndk.publish({
			kind: NOSTR_KINDS.CHAPTER_STEP,
			content: JSON.stringify({
				step_id: step.stepId,
				parent_step_id: step.parentStepId,
				choice_text: step.choiceText,
				price: step.price,
				content_type: step.contentType,
				content: step.content,
				is_end_step: step.isEndStep
			}),
			tags: [
				['t', 'story'],
				['t', 'chapter'],
				['e', storyId],
				...(step.parentStepId
					? [['e', step.parentStepId, 'parent']]
					: [])
			]
		});

		return event.id;
	} catch (err) {
		console.error('Failed to publish chapter step:', err);
		throw new Error('Failed to publish chapter step');
	}
}

export async function deleteStory(storyId: string): Promise<void> {
	try {
		// Delete story metadata
		await ndk.publish({
			kind: NOSTR_KINDS.STORY_METADATA,
			content: '',
			tags: [['e', storyId, 'delete']]
		});

		// Delete all chapter steps
		await ndk.publish({
			kind: NOSTR_KINDS.CHAPTER_STEP,
			content: '',
			tags: [['e', storyId, 'delete']]
		});
	} catch (err) {
		console.error('Failed to delete story:', err);
		throw new Error('Failed to delete story');
	}
} 