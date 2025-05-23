'use client';

import { useEffect, useState } from 'react';
import { FSMBuilder } from '@/components/fsm-builder/fsm-builder';
import { FSMStep, createStep, updateStep, deleteFSM, getFSM } from '@/lib/supabase';

type Props = {
	params: {
		id: string;
	};
};

export default function FSMPage({ params }: Props) {
	const [steps, setSteps] = useState<FSMStep[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadFSM();
	}, []);

	const loadFSM = async () => {
		try {
			const { steps } = await getFSM(params.id);
			setSteps(steps);
		} catch (err) {
			setError('Failed to load FSM');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleStepCreate = async (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => {
		try {
			await createStep(step);
			await loadFSM();
		} catch (err) {
			setError('Failed to create step');
			console.error(err);
		}
	};

	const handleStepUpdate = async (id: string, step: Partial<FSMStep>) => {
		try {
			await updateStep(id, step);
			await loadFSM();
		} catch (err) {
			setError('Failed to update step');
			console.error(err);
		}
	};

	const handleStepDelete = async (id: string) => {
		try {
			await deleteFSM(id);
			await loadFSM();
		} catch (err) {
			setError('Failed to delete step');
			console.error(err);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-xl">Loading FSM...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-xl text-red-600">{error}</div>
			</div>
		);
	}

	return (
		<div className="h-screen">
			<FSMBuilder
				steps={steps}
				onStepCreate={handleStepCreate}
				onStepUpdate={handleStepUpdate}
				onStepDelete={handleStepDelete}
			/>
		</div>
	);
} 