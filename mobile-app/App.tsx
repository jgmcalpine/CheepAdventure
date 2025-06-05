import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { Navigation } from './src/navigation';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 1000 * 60, // 1 minute
		},
	},
});

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<Navigation />
			</AuthProvider>
		</QueryClientProvider>
	);
}
