'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Uncaught error:', error, errorInfo);
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Box className="flex flex-col items-center justify-center min-h-[400px] p-4">
					<Typography variant="h5" className="mb-4">
						Something went wrong
					</Typography>
					<Typography color="text.secondary" className="mb-6 text-center">
						{this.state.error?.message || 'An unexpected error occurred'}
					</Typography>
					<Button variant="contained" onClick={this.handleReset}>
						Try Again
					</Button>
				</Box>
			);
		}

		return this.props.children;
	}
} 