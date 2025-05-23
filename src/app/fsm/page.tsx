'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FSMMetadata, supabase } from '@/lib/supabase';

export default function FSMListPage() {
	const [fsms, setFsms] = useState<FSMMetadata[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [newFsmTitle, setNewFsmTitle] = useState('');
	const [newFsmDescription, setNewFsmDescription] = useState('');

	useEffect(() => {
		loadFSMs();
	}, []);

	const loadFSMs = async () => {
		try {
			const { data, error } = await supabase.from('fsm_metadata').select('*').order('created_at', { ascending: false });
			if (error) throw error;
			setFsms(data || []);
		} catch (err) {
			setError('Failed to load FSMs');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateFSM = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const { data, error } = await supabase
				.from('fsm_metadata')
				.insert({
					title: newFsmTitle,
					description: newFsmDescription,
					user_id: 'placeholder', // Replace with actual user ID from auth
					num_steps: 0,
				})
				.select()
				.single();

			if (error) throw error;

			setFsms([data, ...fsms]);
			setShowCreateForm(false);
			setNewFsmTitle('');
			setNewFsmDescription('');
		} catch (err) {
			setError('Failed to create FSM');
			console.error(err);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-xl">Loading FSMs...</div>
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
		<div className="container mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Finite State Machines</h1>
				<button
					onClick={() => setShowCreateForm(true)}
					className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
				>
					Create New FSM
				</button>
			</div>

			{showCreateForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg w-full max-w-md">
						<h2 className="text-2xl font-bold mb-4">Create New FSM</h2>
						<form onSubmit={handleCreateFSM} className="space-y-4">
							<div>
								<label htmlFor="title" className="block text-sm font-medium text-gray-700">
									Title
								</label>
								<input
									type="text"
									id="title"
									value={newFsmTitle}
									onChange={(e) => setNewFsmTitle(e.target.value)}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="description" className="block text-sm font-medium text-gray-700">
									Description
								</label>
								<textarea
									id="description"
									value={newFsmDescription}
									onChange={(e) => setNewFsmDescription(e.target.value)}
									rows={3}
									className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</div>
							<div className="flex justify-end space-x-2">
								<button
									type="button"
									onClick={() => setShowCreateForm(false)}
									className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
								>
									Cancel
								</button>
								<button
									type="submit"
									className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
								>
									Create
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{fsms.map((fsm) => (
					<Link key={fsm.id} href={`/fsm/${fsm.id}`}>
						<div className="border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
							<h2 className="text-xl font-semibold mb-2">{fsm.title}</h2>
							{fsm.description && <p className="text-gray-600 mb-4">{fsm.description}</p>}
							<div className="flex justify-between text-sm text-gray-500">
								<span>{fsm.num_steps} steps</span>
								<span>{new Date(fsm.created_at).toLocaleDateString()}</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
} 