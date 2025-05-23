'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { FSMBuilder } from '@/components/fsm-builder/fsm-builder';
import { mockFSMSteps } from '@/lib/mock-data';
import { FSMStep } from '@/lib/supabase';

export const metadata: Metadata = {
	title: 'CheepAdventure - FSM Editor Demo',
};

export default function Home() {
	const [steps, setSteps] = useState<FSMStep[]>(mockFSMSteps);

	const handleStepCreate = async (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => {
		const newStep: FSMStep = {
			...step,
			id: `step-${Date.now()}`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		setSteps([...steps, newStep]);
	};

	const handleStepUpdate = async (id: string, step: Partial<FSMStep>) => {
		setSteps(steps.map((s: FSMStep) => (s.id === id ? { ...s, ...step } : s)));
	};

	const handleStepDelete = async (id: string) => {
		setSteps(steps.filter((s: FSMStep) => s.id !== id));
	};

	return (
		<div className="min-h-screen flex flex-col">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold text-gray-900">CheepAdventure FSM Editor</h1>
					<p className="mt-2 text-gray-600">Create and edit your adventure using our visual editor</p>
				</div>
			</header>
			<main className="flex-1">
				<FSMBuilder
					steps={steps}
					onStepCreate={handleStepCreate}
					onStepUpdate={handleStepUpdate}
					onStepDelete={handleStepDelete}
				/>
			</main>
		</div>
	);
}
