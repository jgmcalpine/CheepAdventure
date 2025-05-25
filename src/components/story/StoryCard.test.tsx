import { render, screen } from '@testing-library/react';
import { StoryCard } from './StoryCard';

describe('StoryCard', () => {
	const mockProps = {
		id: '123',
		title: 'Test Story',
		description: 'A test story description',
		coverImageUrl: 'https://example.com/image.jpg',
		authorPubkey: 'npub1234',
		priceSats: 1000,
		createdAt: new Date().toISOString(),
	};

	it('renders story title', () => {
		render(<StoryCard {...mockProps} />);
		expect(screen.getByText('Test Story')).toBeInTheDocument();
	});

	it('renders story description', () => {
		render(<StoryCard {...mockProps} />);
		expect(screen.getByText('A test story description')).toBeInTheDocument();
	});

	it('renders price chip for paid stories', () => {
		render(<StoryCard {...mockProps} />);
		expect(screen.getByText('1000 sats')).toBeInTheDocument();
	});

	it('does not render price chip for free stories', () => {
		render(<StoryCard {...mockProps} priceSats={0} />);
		expect(screen.queryByText('0 sats')).not.toBeInTheDocument();
	});

	it('renders cover image when provided', () => {
		render(<StoryCard {...mockProps} />);
		const image = screen.getByRole('img');
		expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
		expect(image).toHaveAttribute('alt', 'Test Story');
	});

	it('does not render cover image when not provided', () => {
		render(<StoryCard {...mockProps} coverImageUrl={undefined} />);
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('renders read story button', () => {
		render(<StoryCard {...mockProps} />);
		const button = screen.getByRole('link', { name: /read story/i });
		expect(button).toHaveAttribute('href', '/story/123');
	});
}); 