import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';

type SignInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

export default function SignInScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const navigation = useNavigation<SignInScreenNavigationProp>();
	const { signIn } = useAuth();

	const handleSignIn = async () => {
		try {
			setError('');
			await signIn(email, password);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Sign In</Text>
			{error ? <Text style={styles.error}>{error}</Text> : null}
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				keyboardType="email-address"
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleSignIn}>
				<Text style={styles.buttonText}>Sign In</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
				<Text style={styles.link}>Don't have an account? Sign Up</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		padding: 15,
		marginBottom: 15,
		borderRadius: 5,
	},
	button: {
		backgroundColor: '#007AFF',
		padding: 15,
		borderRadius: 5,
		marginBottom: 15,
	},
	buttonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: 'bold',
	},
	link: {
		color: '#007AFF',
		textAlign: 'center',
	},
	error: {
		color: 'red',
		textAlign: 'center',
		marginBottom: 15,
	},
}); 