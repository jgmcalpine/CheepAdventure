import { useCallback, useState } from 'react';
import ReactFlow, {
	Background,
	Controls,
	Edge,
	Node,
	NodeChange,
	applyNodeChanges,
	applyEdgeChanges,
	EdgeChange,
	Connection,
	addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FSMStep } from '@/lib/supabase';
import { StepNode } from './step-node';
import { StepEditor } from './step-editor';

const nodeTypes = {
	step: StepNode,
};

type Props = {
	steps: FSMStep[];
	onStepCreate: (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
	onStepUpdate: (id: string, step: Partial<FSMStep>) => Promise<void>;
	onStepDelete: (id: string) => Promise<void>;
};

export function FSMBuilder({ steps, onStepCreate, onStepUpdate, onStepDelete }: Props) {
	// Convert FSM steps to ReactFlow nodes
	const initialNodes: Node[] = steps.map((step) => ({
		id: step.id,
		type: 'step',
		position: { x: step.position_x, y: step.position_y },
		data: step,
	}));

	// Create edges from next_steps arrays
	const initialEdges: Edge[] = steps.flatMap((step) =>
		step.next_steps.map((nextStepId) => ({
			id: `${step.id}-${nextStepId}`,
			source: step.id,
			target: nextStepId,
			animated: true,
		}))
	);

	const [nodes, setNodes] = useState<Node[]>(initialNodes);
	const [edges, setEdges] = useState<Edge[]>(initialEdges);
	const [selectedStep, setSelectedStep] = useState<FSMStep | null>(null);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const newNodes = applyNodeChanges(changes, nodes);
			setNodes(newNodes);

			// Update step positions in database
			changes.forEach((change) => {
				if (change.type === 'position' && change.position) {
					onStepUpdate(change.id, {
						position_x: change.position.x,
						position_y: change.position.y,
					});
				}
			});
		},
		[nodes, onStepUpdate]
	);

	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			setEdges((eds) => applyEdgeChanges(changes, eds));
		},
		[]
	);

	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source && connection.target) {
				setEdges((eds) => addEdge(connection, eds));

				// Update next_steps array in the source node
				const sourceNode = nodes.find((n) => n.id === connection.source);
				if (sourceNode && sourceNode.data) {
					const newNextSteps = [...sourceNode.data.next_steps, connection.target];
					onStepUpdate(connection.source, { next_steps: newNextSteps });
				}
			}
		},
		[nodes, onStepUpdate]
	);

	const handleStepSelect = useCallback((step: FSMStep) => {
		setSelectedStep(step);
	}, []);

	const handleStepCreate = useCallback(
		async (step: Omit<FSMStep, 'id' | 'created_at' | 'updated_at'>) => {
			await onStepCreate(step);
		},
		[onStepCreate]
	);

	const handleStepUpdate = useCallback(
		async (id: string, step: Partial<FSMStep>) => {
			await onStepUpdate(id, step);
		},
		[onStepUpdate]
	);

	const handleStepDelete = useCallback(
		async (id: string) => {
			await onStepDelete(id);
			setSelectedStep(null);
		},
		[onStepDelete]
	);

	return (
		<div className="w-full h-screen flex">
			<div className="w-3/4 h-full">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					nodeTypes={nodeTypes}
					onNodeClick={(_, node) => handleStepSelect(node.data)}
					fitView
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>
			<div className="w-1/4 h-full border-l border-gray-200 p-4">
				<StepEditor
					selectedStep={selectedStep}
					onStepCreate={handleStepCreate}
					onStepUpdate={handleStepUpdate}
					onStepDelete={handleStepDelete}
				/>
			</div>
		</div>
	);
} 