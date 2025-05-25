'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationContextType {
	showNotification: (message: string, severity?: AlertColor) => void;
}

const NotificationContext = createContext<NotificationContextType>({
	showNotification: () => {}
});

export function useNotification() {
	return useContext(NotificationContext);
}

interface NotificationProviderProps {
	children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState('');
	const [severity, setSeverity] = useState<AlertColor>('success');

	const showNotification = (
		message: string,
		severity: AlertColor = 'success'
	) => {
		setMessage(message);
		setSeverity(severity);
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<NotificationContext.Provider value={{ showNotification }}>
			{children}
			<Snackbar
				open={open}
				autoHideDuration={6000}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					onClose={handleClose}
					severity={severity}
					variant="filled"
					sx={{ width: '100%' }}
				>
					{message}
				</Alert>
			</Snackbar>
		</NotificationContext.Provider>
	);
} 