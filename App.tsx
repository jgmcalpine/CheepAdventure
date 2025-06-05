import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import GameDetailScreen from '@/screens/games/GameDetailScreen';
import GameListScreen from '@/screens/games/GameListScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

function AppNavigator() {
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		// Initialize audio service when app starts
		if (isAuthenticated) {
			// TODO: Initialize audio service
		}
	}, [isAuthenticated]);

	if (isLoading) {
		// TODO: Add loading screen
		return null;
	}

	return (
		<Stack.Navigator>
			{!isAuthenticated ? (
				// Auth screens
				<Stack.Group screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Login" component={LoginScreen} />
					<Stack.Screen name="SignUp" component={SignUpScreen} />
				</Stack.Group>
			) : (
				// App screens
				<Stack.Group>
					<Stack.Screen
						name="GameList"
						component={GameListScreen}
						options={{ title: "Today's Games" }}
					/>
					<Stack.Screen
						name="GameDetail"
						component={GameDetailScreen}
						options={({ route }) => ({
							title: `${route.params.homeTeam} vs ${route.params.awayTeam}`,
						})}
					/>
					<Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
				</Stack.Group>
			)}
		</Stack.Navigator>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<SafeAreaProvider>
				<AuthProvider>
					<NavigationContainer>
						<AppNavigator />
						<StatusBar style="auto" />
					</NavigationContainer>
				</AuthProvider>
			</SafeAreaProvider>
		</QueryClientProvider>
	);
} 