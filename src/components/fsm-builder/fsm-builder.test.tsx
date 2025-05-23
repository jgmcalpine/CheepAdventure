import { render, screen, fireEvent } from '@testing-library/react';
import { FSMBuilder } from './fsm-builder';
import { mockSteps } from '@/lib/mock-data';

// Mock ReactFlow as it's not compatible with Jest's DOM environment
jest.mock('reactflow', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
	Background: () => <div data-testid="react-flow-background" />,
	Controls: () => <div data-testid="react-flow-controls" />,
	Handle: ({ type, position }: { type: string; position: string }) => (
		<div data-testid={`handle-${type}-${position}`} />
	),
}));

describe('FSMBuilder', () => {
	const mockHandleStepCreate = jest.fn();
	const mockHandleStepUpdate = jest.fn();
	const mockHandleStepDelete = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders FSM builder with mock steps', () => {
		render(
			<FSMBuilder
				steps={mockSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Check if ReactFlow and its components are rendered
		expect(screen.getByTestId('react-flow')).toBeInTheDocument();
		expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
		expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();
	});

	it('displays step editor when a step is selected', () => {
		render(
			<FSMBuilder
				steps={mockSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Find and click the first step node
		const firstStep = screen.getByText(mockSteps[0].title);
		fireEvent.click(firstStep);

		// Check if step editor is displayed with step details
		expect(screen.getByText('Edit Step')).toBeInTheDocument();
		expect(screen.getByDisplayValue(mockSteps[0].title)).toBeInTheDocument();
		expect(screen.getByDisplayValue(mockSteps[0].content)).toBeInTheDocument();
	});

	it('creates a new step', () => {
		render(
			<FSMBuilder
				steps={mockSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Find and click the "Create New Step" button
		const createButton = screen.getByText('Create New Step');
		fireEvent.click(createButton);

		// Fill in step details
		const titleInput = screen.getByLabelText('Title');
		const contentInput = screen.getByLabelText('Content');
		fireEvent.change(titleInput, { target: { value: 'New Step' } });
		fireEvent.change(contentInput, { target: { value: 'New step content' } });

		// Submit the form
		const submitButton = screen.getByText('Create Step');
		fireEvent.click(submitButton);

		// Check if onStepCreate was called with correct data
		expect(mockHandleStepCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'New Step',
				content: 'New step content',
				media_type: 'text',
			})
		);
	});

	it('updates an existing step', () => {
		render(
			<FSMBuilder
				steps={mockSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Find and click the first step node
		const firstStep = screen.getByText(mockSteps[0].title);
		fireEvent.click(firstStep);

		// Update step details
		const titleInput = screen.getByLabelText('Title');
		fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

		// Submit the form
		const submitButton = screen.getByText('Update Step');
		fireEvent.click(submitButton);

		// Check if onStepUpdate was called with correct data
		expect(mockHandleStepUpdate).toHaveBeenCalledWith(
			mockSteps[0].id,
			expect.objectContaining({
				title: 'Updated Title',
			})
		);
	});

	it('deletes a step', () => {
		render(
			<FSMBuilder
				steps={mockSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Find and click the first step node
		const firstStep = screen.getByText(mockSteps[0].title);
		fireEvent.click(firstStep);

		// Find and click the delete button
		const deleteButton = screen.getByText('Delete Step');
		fireEvent.click(deleteButton);

		// Check if onStepDelete was called with correct step ID
		expect(mockHandleStepDelete).toHaveBeenCalledWith(mockSteps[0].id);
	});
}); 