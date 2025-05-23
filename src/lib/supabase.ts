import { createClient } from '@supabase/supabase-js';

// These types will be used throughout the application
export type FSMMetadata = {
	id: string;
	title: string;
	description: string;
	user_id: string;
	num_steps: number;
	created_at: string;
	updated_at: string;
};

export type FSMStep = {
	id: string;
	fsm_id: string;
	title: string;
	content: string;
	media_type: 'text' | 'image' | 'video';
	media_url?: string;
	next_steps: string[];
	position_x: number;
	position_y: number;
	created_at: string;
	updated_at: string;
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
export const createFSM = async (metadata: Omit<FSMMetadata, 'id' | 'created_at' | 'updated_at'>) => {
	const { data, error } = await supabase
		.from('fsm_metadata')
		.insert(metadata)
		.select()
		.single();

	if (error) throw error;
	return data;
};

export const createStep = async (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => {
	const { data, error } = await supabase
		.from('fsm_steps')
		.insert(step)
		.select()
		.single();

	if (error) throw error;
	return data;
};

export const updateStep = async (id: string, step: Partial<FSMStep>) => {
	const { data, error } = await supabase
		.from('fsm_steps')
		.update(step)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data;
};

export const getFSM = async (id: string) => {
	const { data: metadata, error: metadataError } = await supabase
		.from('fsm_metadata')
		.select()
		.eq('id', id)
		.single();

	if (metadataError) throw metadataError;

	const { data: steps, error: stepsError } = await supabase
		.from('fsm_steps')
		.select()
		.eq('fsm_id', id);

	if (stepsError) throw stepsError;

	return { metadata, steps };
};

export const deleteFSM = async (id: string) => {
	const { error: stepsError } = await supabase
		.from('fsm_steps')
		.delete()
		.eq('fsm_id', id);

	if (stepsError) throw stepsError;

	const { error: metadataError } = await supabase
		.from('fsm_metadata')
		.delete()
		.eq('id', id);

	if (metadataError) throw metadataError;
}; 