import { render, screen, fireEvent } from '@testing-library/react';
import { TopNav } from './TopNav';

// Mock next/navigation
jest.mock('next/navigation', () => ({
	usePathname: () => '/read',
}));

describe('TopNav', () => {
	const mockUser = {
		profile: {
			image: 'https://example.com/avatar.jpg',
		},
	};

	it('renders navigation links', () => {
		render(<TopNav />);
		expect(screen.getByText('Read')).toBeInTheDocument();
		expect(screen.getByText('Write')).toBeInTheDocument();
	});

	it('highlights active route', () => {
		render(<TopNav />);
		const activeLink = screen.getByText('Read');
		expect(activeLink.closest('a')).toHaveClass('bg-gray-900');
	});

	it('shows Connect button when user is not authenticated', () => {
		render(<TopNav />);
		expect(screen.getByText('Connect')).toBeInTheDocument();
	});

	it('shows profile image when user is authenticated', () => {
		render(<TopNav user={mockUser} />);
		expect(screen.getByAltText('Profile')).toBeInTheDocument();
	});

	it('shows default avatar when user has no profile image', () => {
		render(<TopNav user={{}} />);
		expect(screen.getByText('👤')).toBeInTheDocument();
	});

	it('toggles mobile menu', () => {
		render(<TopNav />);
		const menuButton = screen.getByLabelText('Open main menu');
		fireEvent.click(menuButton);
		expect(screen.getByText('Read')).toBeVisible();
		fireEvent.click(menuButton);
		expect(screen.queryByText('Read')).not.toBeVisible();
	});

	it('shows disconnect option in profile dropdown', () => {
		const onDisconnect = jest.fn();
		render(<TopNav user={mockUser} onDisconnect={onDisconnect} />);
		
		// Open profile dropdown
		const profileButton = screen.getByAltText('Profile');
		fireEvent.click(profileButton);
		
		// Click disconnect
		const disconnectButton = screen.getByText('Disconnect');
		fireEvent.click(disconnectButton);
		
		expect(onDisconnect).toHaveBeenCalled();
	});

	it('calls onConnect when Connect button is clicked', () => {
		const onConnect = jest.fn();
		render(<TopNav onConnect={onConnect} />);
		
		const connectButton = screen.getByText('Connect');
		fireEvent.click(connectButton);
		
		expect(onConnect).toHaveBeenCalled();
	});
}); 