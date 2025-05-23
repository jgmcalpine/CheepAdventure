import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { FSMBuilder } from './fsm-builder';
import { mockFSMSteps } from '@/lib/mock-data';

// Mock ReactFlow as it's not compatible with Jest's DOM environment
jest.mock('reactflow', () => ({
	__esModule: true,
	default: ({ children, nodes, nodeTypes, onNodeClick }: any) => (
		<div data-testid="react-flow">
			{children}
			{nodes.map((node: any) => {
				const NodeComponent = nodeTypes[node.type];
				return (
					<div key={node.id} onClick={() => onNodeClick(null, node)}>
						<NodeComponent data={node.data} />
					</div>
				);
			})}
		</div>
	),
	Background: () => <div data-testid="react-flow-background" />,
	Controls: () => <div data-testid="react-flow-controls" />,
	Handle: ({ type, position }: { type: string; position: string }) => (
		<div data-testid={`handle-${type}-${position}`} />
	),
	Position: {
		Top: 'top',
		Bottom: 'bottom',
	},
}));

// Mock StepNode component
jest.mock('./step-node', () => ({
	StepNode: ({ data }: any) => (
		<div data-testid={`step-node-${data.id}`}>
			<h3>{data.title}</h3>
			{data.media_type === 'text' && <p>{data.content}</p>}
			{data.media_type === 'image' && <img src={data.media_url} alt={data.title} />}
			{data.media_type === 'video' && <div data-testid="react-player" />}
		</div>
	),
}));

// Mock StepEditor component
jest.mock('./step-editor', () => ({
	StepEditor: ({ selectedStep, onStepCreate, onStepUpdate, onStepDelete }: any) => (
		<div data-testid="step-editor">
			{selectedStep ? (
				<>
					<input type="text" value={selectedStep.title} readOnly />
					<textarea value={selectedStep.content} readOnly />
				</>
			) : (
				<div>Create New Step</div>
			)}
		</div>
	),
}));

describe('FSMBuilder', () => {
	const mockHandleStepCreate = jest.fn();
	const mockHandleStepUpdate = jest.fn();
	const mockHandleStepDelete = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders FSM builder with initial steps', () => {
		render(
			<FSMBuilder
				steps={mockFSMSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Check if ReactFlow container is rendered
		expect(screen.getByTestId('react-flow')).toBeInTheDocument();

		// Check if background and controls are rendered
		expect(screen.getByTestId('react-flow-background')).toBeInTheDocument();
		expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument();

		// Check if all steps are rendered
		mockFSMSteps.forEach((step) => {
			expect(screen.getByTestId(`step-node-${step.id}`)).toBeInTheDocument();
			expect(screen.getByText(step.title)).toBeInTheDocument();
		});
	});

	it('displays step content based on media type', () => {
		render(
			<FSMBuilder
				steps={mockFSMSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Check text content
		const textStep = mockFSMSteps.find((step) => step.media_type === 'text');
		if (textStep) {
			expect(screen.getByText(textStep.content)).toBeInTheDocument();
		}

		// Check image content
		const imageStep = mockFSMSteps.find((step) => step.media_type === 'image');
		if (imageStep && imageStep.media_url) {
			const image = screen.getByAltText(imageStep.title);
			expect(image).toHaveAttribute('src', imageStep.media_url);
		}

		// Check video content
		const videoStep = mockFSMSteps.find((step) => step.media_type === 'video');
		if (videoStep && videoStep.media_url) {
			expect(screen.getByTestId('react-player')).toBeInTheDocument();
		}
	});

	it('handles step selection', () => {
		render(
			<FSMBuilder
				steps={mockFSMSteps}
				onStepCreate={mockHandleStepCreate}
				onStepUpdate={mockHandleStepUpdate}
				onStepDelete={mockHandleStepDelete}
			/>
		);

		// Click on a step
		const firstStep = mockFSMSteps[0];
		const stepNode = screen.getByTestId(`step-node-${firstStep.id}`);
		fireEvent.click(stepNode.parentElement!);

		// Check if step editor is displayed with step data
		expect(screen.getByDisplayValue(firstStep.title)).toBeInTheDocument();
		expect(screen.getByDisplayValue(firstStep.content)).toBeInTheDocument();
	});
}); 