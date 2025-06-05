import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens (to be created)
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import GamesListScreen from '../screens/GamesListScreen';
import GameDetailScreen from '../screens/GameDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
	SignIn: undefined;
	SignUp: undefined;
	GamesList: undefined;
	GameDetail: { gameId: string };
	Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation = () => {
	const { session, loading } = useAuth();

	if (loading) {
		// TODO: Add loading screen
		return null;
	}

	return (
		<NavigationContainer>
			<Stack.Navigator>
				{session ? (
					// Authenticated stack
					<>
						<Stack.Screen
							name="GamesList"
							component={GamesListScreen}
							options={{ title: 'Live Games' }}
						/>
						<Stack.Screen
							name="GameDetail"
							component={GameDetailScreen}
							options={{ title: 'Game Details' }}
						/>
						<Stack.Screen
							name="Profile"
							component={ProfileScreen}
							options={{ title: 'Profile' }}
						/>
					</>
				) : (
					// Auth stack
					<>
						<Stack.Screen
							name="SignIn"
							component={SignInScreen}
							options={{ title: 'Sign In' }}
						/>
						<Stack.Screen
							name="SignUp"
							component={SignUpScreen}
							options={{ title: 'Create Account' }}
						/>
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}; 