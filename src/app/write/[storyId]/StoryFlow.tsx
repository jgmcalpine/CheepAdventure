'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
	Node,
	Edge,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Position,
	MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Typography, Chip } from '@mui/material';

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

interface StoryFlowProps {
	steps: ChapterStep[];
	onNodeClick?: (stepId: string) => void;
}

const nodeWidth = 250;
const nodeHeight = 100;

const ChapterNode = ({ data }: { data: any }) => {
	return (
		<Box
			sx={{
				p: 2,
				width: nodeWidth - 2,
				height: nodeHeight - 2,
				bgcolor: 'background.paper',
				borderRadius: 1,
				border: 1,
				borderColor: data.isEndStep ? 'error.main' : 'divider',
				'&:hover': {
					borderColor: 'primary.main'
				}
			}}
		>
			<Typography
				variant="subtitle2"
				gutterBottom
				sx={{
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis'
				}}
			>
				{data.choiceText || 'Initial Chapter'}
			</Typography>
			<Typography
				variant="body2"
				color="text.secondary"
				sx={{
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
					mb: 1
				}}
			>
				{data.content}
			</Typography>
			<Box
				sx={{
					display: 'flex',
					gap: 1,
					alignItems: 'center'
				}}
			>
				{data.isEndStep && (
					<Chip
						label="End"
						size="small"
						color="error"
						sx={{ height: 20 }}
					/>
				)}
				{data.price > 0 && (
					<Chip
						label={`${data.price} sats`}
						size="small"
						color="primary"
						sx={{ height: 20 }}
					/>
				)}
			</Box>
		</Box>
	);
};

const nodeTypes = {
	chapter: ChapterNode
};

export default function StoryFlow({ steps, onNodeClick }: StoryFlowProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const { flowNodes, flowEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		// Helper function to calculate node positions
		const calculateNodePosition = (
			stepId: string,
			level: number,
			siblingIndex: number,
			siblingCount: number
		) => {
			const xSpacing = nodeWidth * 1.5;
			const ySpacing = nodeHeight * 2;
			const levelWidth = siblingCount * xSpacing;
			const startX = -(levelWidth / 2) + xSpacing / 2;

			return {
				x: startX + siblingIndex * xSpacing,
				y: level * ySpacing
			};
		};

		// Build a map of levels
		const levelMap = new Map<number, ChapterStep[]>();
		const processedNodes = new Set<string>();

		// Start with root nodes (no parent)
		const rootNodes = steps.filter((step) => !step.parentStepId);
		levelMap.set(0, rootNodes);
		rootNodes.forEach((node) => processedNodes.add(node.stepId));

		// Process remaining nodes level by level
		let currentLevel = 0;
		while (processedNodes.size < steps.length) {
			const currentNodes = levelMap.get(currentLevel) || [];
			const nextLevelNodes: ChapterStep[] = [];

			currentNodes.forEach((parent) => {
				const children = steps.filter(
					(step) =>
						step.parentStepId === parent.stepId &&
						!processedNodes.has(step.stepId)
				);
				nextLevelNodes.push(...children);
				children.forEach((child) =>
					processedNodes.add(child.stepId)
				);
			});

			if (nextLevelNodes.length > 0) {
				levelMap.set(currentLevel + 1, nextLevelNodes);
			}
			currentLevel++;
		}

		// Create nodes and edges
		levelMap.forEach((levelNodes, level) => {
			levelNodes.forEach((step, index) => {
				const position = calculateNodePosition(
					step.stepId,
					level,
					index,
					levelNodes.length
				);

				nodes.push({
					id: step.stepId,
					type: 'chapter',
					position,
					data: {
						...step,
						label: step.choiceText || 'Initial Chapter'
					},
					sourcePosition: Position.Bottom,
					targetPosition: Position.Top
				});

				if (step.parentStepId) {
					edges.push({
						id: `${step.parentStepId}-${step.stepId}`,
						source: step.parentStepId,
						target: step.stepId,
						markerEnd: {
							type: MarkerType.ArrowClosed
						},
						style: {
							stroke: '#999'
						},
						label: step.choiceText || ''
					});
				}
			});
		});

		return { flowNodes: nodes, flowEdges: edges };
	}, [steps]);

	const handleNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			onNodeClick?.(node.id);
		},
		[onNodeClick]
	);

	return (
		<Box sx={{ width: '100%', height: '600px' }}>
			<ReactFlow
				nodes={flowNodes}
				edges={flowEdges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeClick={handleNodeClick}
				nodeTypes={nodeTypes}
				fitView
				attributionPosition="bottom-left"
			>
				<Background />
				<Controls />
				<MiniMap />
			</ReactFlow>
		</Box>
	);
} 