'use client';

import { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	IconButton,
	Tooltip,
} from '@mui/material';
import type { Ticket, TicketStatus, TicketPriority } from '@/lib/types/ticket';

const statusColors: Record<TicketStatus, string> = {
	'open': 'bg-blue-500',
	'in-progress': 'bg-yellow-500',
	'resolved': 'bg-green-500',
	'closed': 'bg-gray-500',
};

const priorityColors: Record<TicketPriority, string> = {
	'low': 'bg-gray-400',
	'medium': 'bg-blue-400',
	'high': 'bg-orange-400',
	'urgent': 'bg-red-400',
};

type Props = {
	tickets: Ticket[];
	onTicketClick?: (ticket: Ticket) => void;
};

export default function TicketList({ tickets, onTicketClick }: Props) {
	return (
		<TableContainer component={Paper} className="shadow-lg">
			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Title</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Priority</TableCell>
						<TableCell>Assignee</TableCell>
						<TableCell>Created</TableCell>
						<TableCell>Updated</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{tickets.map((ticket) => (
						<TableRow
							key={ticket.id}
							onClick={() => onTicketClick?.(ticket)}
							className="hover:bg-gray-50 cursor-pointer"
						>
							<TableCell>{ticket.title}</TableCell>
							<TableCell>
								<Chip
									label={ticket.status}
									className={`${statusColors[ticket.status]} text-white`}
								/>
							</TableCell>
							<TableCell>
								<Chip
									label={ticket.priority}
									className={`${priorityColors[ticket.priority]} text-white`}
								/>
							</TableCell>
							<TableCell>{ticket.assignee || 'Unassigned'}</TableCell>
							<TableCell>{ticket.createdAt.toLocaleDateString()}</TableCell>
							<TableCell>{ticket.updatedAt.toLocaleDateString()}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
} 