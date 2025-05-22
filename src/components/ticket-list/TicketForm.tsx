'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material';
import type { Ticket, CreateTicketInput, UpdateTicketInput, TicketStatus, TicketPriority } from '@/lib/types/ticket';

type Props = {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CreateTicketInput) => void;
	ticket?: Ticket;
};

const defaultTicket: CreateTicketInput = {
	title: '',
	description: '',
	status: 'open',
	priority: 'medium',
	assignee: '',
};

export default function TicketForm({ open, onClose, onSubmit, ticket }: Props) {
	const [formData, setFormData] = useState<CreateTicketInput>(() => {
		if (ticket) {
			const { id, createdAt, updatedAt, ...rest } = ticket;
			return rest;
		}
		return defaultTicket;
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<form onSubmit={handleSubmit}>
				<DialogTitle>{ticket ? 'Edit Ticket' : 'Create Ticket'}</DialogTitle>
				<DialogContent>
					<div className="space-y-4 py-4">
						<TextField
							label="Title"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							fullWidth
							required
						/>
						<TextField
							label="Description"
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							fullWidth
							multiline
							rows={4}
							required
						/>
						<FormControl fullWidth>
							<InputLabel>Status</InputLabel>
							<Select
								value={formData.status}
								label="Status"
								onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
							>
								<MenuItem value="open">Open</MenuItem>
								<MenuItem value="in-progress">In Progress</MenuItem>
								<MenuItem value="resolved">Resolved</MenuItem>
								<MenuItem value="closed">Closed</MenuItem>
							</Select>
						</FormControl>
						<FormControl fullWidth>
							<InputLabel>Priority</InputLabel>
							<Select
								value={formData.priority}
								label="Priority"
								onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
							>
								<MenuItem value="low">Low</MenuItem>
								<MenuItem value="medium">Medium</MenuItem>
								<MenuItem value="high">High</MenuItem>
								<MenuItem value="urgent">Urgent</MenuItem>
							</Select>
						</FormControl>
						<TextField
							label="Assignee"
							value={formData.assignee}
							onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
							fullWidth
						/>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Cancel</Button>
					<Button type="submit" variant="contained" color="primary">
						{ticket ? 'Update' : 'Create'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
} 