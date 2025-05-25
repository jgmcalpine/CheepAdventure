import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { NotificationProvider } from '@/components/Notification';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Nostr Stories - Interactive Fiction on Lightning',
	description:
		'Read, write, and share interactive "choose-your-own" stories on Nostr with Lightning payments.',
	icons: {
		icon: '/favicon.ico'
	}
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<NotificationProvider>
					<AppRouterCacheProvider>
						<ThemeProvider theme={theme}>
							<CssBaseline />
							<AuthProvider>{children}</AuthProvider>
						</ThemeProvider>
					</AppRouterCacheProvider>
				</NotificationProvider>
			</body>
		</html>
	);
}
