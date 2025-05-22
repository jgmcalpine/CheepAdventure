'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import TicketList from '@/components/ticket-list/TicketList';
import TicketForm from '@/components/ticket-list/TicketForm';
import type { Ticket, CreateTicketInput } from '@/lib/types/ticket';

// Mock data
const mockTickets: Ticket[] = [
	{
		id: '1',
		title: 'Implement user authentication',
		description: 'Add user authentication using NextAuth.js',
		status: 'open',
		priority: 'high',
		assignee: 'John Doe',
		createdAt: new Date('2024-05-20'),
		updatedAt: new Date('2024-05-20'),
	},
	{
		id: '2',
		title: 'Fix responsive layout issues',
		description: 'Mobile layout is broken on small screens',
		status: 'in-progress',
		priority: 'medium',
		assignee: 'Jane Smith',
		createdAt: new Date('2024-05-19'),
		updatedAt: new Date('2024-05-21'),
	},
	{
		id: '3',
		title: 'Add dark mode support',
		description: 'Implement dark mode using TailwindCSS',
		status: 'resolved',
		priority: 'low',
		assignee: 'Bob Johnson',
		createdAt: new Date('2024-05-18'),
		updatedAt: new Date('2024-05-22'),
	},
];

export default function TicketsPage() {
	const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<Ticket | undefined>();

	const handleSubmit = (data: CreateTicketInput) => {
		if (selectedTicket) {
			// Handle edit
			const updatedTickets = tickets.map((ticket) =>
				ticket.id === selectedTicket.id
					? {
							...ticket,
							...data,
							updatedAt: new Date(),
					  }
					: ticket
			);
			setTickets(updatedTickets);
		} else {
			// Handle create
			const newTicket: Ticket = {
				...data,
				id: (tickets.length + 1).toString(),
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			setTickets([...tickets, newTicket]);
		}
	};

	const handleTicketClick = (ticket: Ticket) => {
		setSelectedTicket(ticket);
		setIsFormOpen(true);
	};

	return (
		<div className="container mx-auto p-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Tickets</h1>
				<Button
					variant="contained"
					color="primary"
					onClick={() => {
						setSelectedTicket(undefined);
						setIsFormOpen(true);
					}}
				>
					Create Ticket
				</Button>
			</div>

			<TicketList tickets={tickets} onTicketClick={handleTicketClick} />

			<TicketForm
				open={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setSelectedTicket(undefined);
				}}
				onSubmit={handleSubmit}
				ticket={selectedTicket}
			/>
		</div>
	);
} 