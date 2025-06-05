import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// Import screens (to be created)
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import GamesListScreen from '../screens/games/GamesListScreen';
import GameDetailsScreen from '../screens/games/GameDetailsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation = () => {
	const { user, loading } = useAuth();

	if (loading) {
		// TODO: Add loading screen
		return null;
	}

	return (
		<NavigationContainer>
			<Stack.Navigator
				screenOptions={{
					headerShown: true,
					headerStyle: {
						backgroundColor: '#f4511e',
					},
					headerTintColor: '#fff',
					headerTitleStyle: {
						fontWeight: 'bold',
					},
				}}
			>
				{!user ? (
					// Auth Stack
					<>
						<Stack.Screen
							name="Login"
							component={LoginScreen}
							options={{ title: 'Sign In' }}
						/>
						<Stack.Screen
							name="SignUp"
							component={SignUpScreen}
							options={{ title: 'Create Account' }}
						/>
					</>
				) : (
					// Main Stack
					<>
						<Stack.Screen
							name="GamesList"
							component={GamesListScreen}
							options={{ title: 'Live Games' }}
						/>
						<Stack.Screen
							name="GameDetails"
							component={GameDetailsScreen}
							options={({ route }) => ({
								title: `${route.params.homeTeam} vs ${route.params.awayTeam}`,
							})}
						/>
						<Stack.Screen
							name="Profile"
							component={ProfileScreen}
							options={{ title: 'My Profile' }}
						/>
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}; 