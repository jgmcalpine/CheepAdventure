'use client';

import { useAuth } from '@/contexts/AuthContext'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'
import GameList from '@/components/games/GameList'
import { Box, Paper, Tabs, Tab, Typography } from '@mui/material'
import { useState } from 'react'

interface TabPanelProps {
	children?: React.ReactNode
	index: number
	value: number
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`auth-tabpanel-${index}`}
			aria-labelledby={`auth-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					{children}
				</Box>
			)}
		</div>
	)
}

export default function Home() {
	const { user, loading } = useAuth()
	const [tabValue, setTabValue] = useState(0)

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue)
	}

	if (loading) {
		return (
			<Box sx={{ textAlign: 'center', mt: 4 }}>
				<Typography>Loading...</Typography>
			</Box>
		)
	}

	if (!user) {
		return (
			<Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
				<Paper>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						variant="fullWidth"
					>
						<Tab label="Sign In" />
						<Tab label="Sign Up" />
					</Tabs>
					<TabPanel value={tabValue} index={0}>
						<SignInForm />
					</TabPanel>
					<TabPanel value={tabValue} index={1}>
						<SignUpForm />
					</TabPanel>
				</Paper>
			</Box>
		)
	}

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Today's Games
			</Typography>
			<GameList />
		</Box>
	)
}
