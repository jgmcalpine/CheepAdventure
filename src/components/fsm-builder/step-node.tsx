import { Handle, Position } from 'reactflow';
import { FSMStep } from '@/lib/supabase';
import ReactPlayer from 'react-player';

type Props = {
	data: FSMStep;
};

export function StepNode({ data }: Props) {
	return (
		<div className="bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
			<Handle type="target" position={Position.Top} />
			<div className="mb-2">
				<h3 className="text-lg font-semibold">{data.title}</h3>
			</div>
			<div className="mb-4">
				{data.media_type === 'text' && <p className="text-sm">{data.content}</p>}
				{data.media_type === 'image' && data.media_url && (
					<img src={data.media_url} alt={data.title} className="w-full h-auto rounded" />
				)}
				{data.media_type === 'video' && data.media_url && (
					<div className="w-full aspect-video">
						<ReactPlayer url={data.media_url} width="100%" height="100%" controls />
					</div>
				)}
			</div>
			<Handle type="source" position={Position.Bottom} />
		</div>
	);
} 