import { useState, useEffect } from 'react';
import { FSMStep } from '@/lib/supabase';

type Props = {
	selectedStep: FSMStep | null;
	onStepCreate: (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
	onStepUpdate: (id: string, step: Partial<FSMStep>) => Promise<void>;
	onStepDelete: (id: string) => Promise<void>;
};

export function StepEditor({ selectedStep, onStepCreate, onStepUpdate, onStepDelete }: Props) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
	const [mediaUrl, setMediaUrl] = useState('');

	useEffect(() => {
		if (selectedStep) {
			setTitle(selectedStep.title);
			setContent(selectedStep.content);
			setMediaType(selectedStep.media_type);
			setMediaUrl(selectedStep.media_url || '');
		} else {
			setTitle('');
			setContent('');
			setMediaType('text');
			setMediaUrl('');
		}
	}, [selectedStep]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const stepData = {
			title,
			content,
			media_type: mediaType,
			media_url: mediaUrl || undefined,
			next_steps: selectedStep?.next_steps || [],
			position_x: selectedStep?.position_x || 0,
			position_y: selectedStep?.position_y || 0,
			fsm_id: selectedStep?.fsm_id || '',
		};

		if (selectedStep) {
			await onStepUpdate(selectedStep.id, stepData);
		} else {
			await onStepCreate(stepData);
		}
	};

	return (
		<div className="h-full overflow-y-auto">
			<h2 className="text-xl font-bold mb-4">{selectedStep ? 'Edit Step' : 'Create New Step'}</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="title" className="block text-sm font-medium text-gray-700">
						Title
					</label>
					<input
						type="text"
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						required
					/>
				</div>

				<div>
					<label htmlFor="mediaType" className="block text-sm font-medium text-gray-700">
						Media Type
					</label>
					<select
						id="mediaType"
						value={mediaType}
						onChange={(e) => setMediaType(e.target.value as 'text' | 'image' | 'video')}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					>
						<option value="text">Text</option>
						<option value="image">Image</option>
						<option value="video">Video</option>
					</select>
				</div>

				{mediaType === 'text' ? (
					<div>
						<label htmlFor="content" className="block text-sm font-medium text-gray-700">
							Content
						</label>
						<textarea
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={4}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							required
						/>
					</div>
				) : (
					<div>
						<label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700">
							Media URL
						</label>
						<input
							type="url"
							id="mediaUrl"
							value={mediaUrl}
							onChange={(e) => setMediaUrl(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							required
						/>
					</div>
				)}

				<div className="flex justify-between">
					<button
						type="submit"
						className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						{selectedStep ? 'Update Step' : 'Create Step'}
					</button>
					{selectedStep && (
						<button
							type="button"
							onClick={() => onStepDelete(selectedStep.id)}
							className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
						>
							Delete Step
						</button>
					)}
				</div>
			</form>
		</div>
	);
} 