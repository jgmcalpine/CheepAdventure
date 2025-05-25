'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { FSMBuilder } from '@/components/fsm-builder/fsm-builder';
import { mockFSM, mockSteps } from '@/lib/mock-data';
import { FSMStep } from '@/lib/supabase';
import { Container, Typography, Button, Box, Stack } from '@mui/material';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'CheepAdventure - FSM Editor Demo',
};

export default function LandingPage() {
	return (
		<Container maxWidth="lg">
			<Box
				component="main"
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					textAlign: 'center',
					py: 8
				}}
			>
				<Typography
					variant="h1"
					component="h1"
					sx={{
						fontSize: { xs: '2.5rem', md: '4rem' },
						fontWeight: 700,
						mb: 2
					}}
				>
					Choose Your Own Adventure
				</Typography>

				<Typography
					variant="h2"
					component="h2"
					sx={{
						fontSize: { xs: '1.5rem', md: '2rem' },
						fontWeight: 500,
						color: 'text.secondary',
						mb: 6
					}}
				>
					Read, write, and share interactive stories on Nostr
				</Typography>

				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={3}
					sx={{ mb: 8 }}
				>
					<Link href="/read" passHref>
						<Button
							variant="contained"
							size="large"
							sx={{
								px: 4,
								py: 2,
								fontSize: '1.25rem'
							}}
						>
							Start Reading
						</Button>
					</Link>

					<Link href="/write" passHref>
						<Button
							variant="outlined"
							size="large"
							sx={{
								px: 4,
								py: 2,
								fontSize: '1.25rem'
							}}
						>
							Start Writing
						</Button>
					</Link>
				</Stack>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
						gap: 4,
						width: '100%',
						maxWidth: 'lg',
						mt: 8
					}}
				>
					<FeatureCard
						title="Decentralized"
						description="Your stories live on the Nostr network, not controlled by any single entity."
					/>
					<FeatureCard
						title="Monetize"
						description="Add Lightning paywalls to premium chapters and earn sats."
					/>
					<FeatureCard
						title="Interactive"
						description="Create branching narratives where readers choose their path."
					/>
				</Box>
			</Box>
		</Container>
	);
}

function FeatureCard({ title, description }: { title: string; description: string }) {
	return (
		<Box
			sx={{
				p: 4,
				borderRadius: 2,
				bgcolor: 'background.paper',
				boxShadow: 1,
				textAlign: 'center'
			}}
		>
			<Typography
				variant="h5"
				component="h3"
				sx={{
					fontWeight: 600,
					mb: 2
				}}
			>
				{title}
			</Typography>
			<Typography variant="body1" color="text.secondary">
				{description}
			</Typography>
		</Box>
	);
}
