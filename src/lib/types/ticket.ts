export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
	id: string;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	assignee?: string;
	createdAt: Date;
	updatedAt: Date;
}

export type CreateTicketInput = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTicketInput = Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>; 