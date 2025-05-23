import { FSMMetadata, FSMStep } from './supabase';

export const mockFSMMetadata: FSMMetadata = {
	id: 'mock-fsm-1',
	title: 'Example Adventure',
	description: 'A sample adventure to demonstrate the FSM editor',
	user_id: 'mock-user',
	num_steps: 3,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
};

export const mockFSMSteps: FSMStep[] = [
	{
		id: 'step-1',
		fsm_id: 'mock-fsm-1',
		title: 'Start Your Journey',
		content: 'You find yourself at a crossroads. Which path will you choose?',
		media_type: 'text',
		next_steps: ['step-2', 'step-3'],
		position_x: 100,
		position_y: 100,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 'step-2',
		fsm_id: 'mock-fsm-1',
		title: 'The Forest Path',
		content: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
		media_type: 'image',
		media_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
		next_steps: [],
		position_x: 400,
		position_y: 0,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: 'step-3',
		fsm_id: 'mock-fsm-1',
		title: 'The Mountain Path',
		content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		media_type: 'video',
		media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		next_steps: [],
		position_x: 400,
		position_y: 200,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
]; 