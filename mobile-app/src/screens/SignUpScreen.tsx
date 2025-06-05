import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../contexts/AuthContext';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

export default function SignUpScreen() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const navigation = useNavigation<SignUpScreenNavigationProp>();
	const { signUp } = useAuth();

	const handleSignUp = async () => {
		try {
			setError('');
			if (password !== confirmPassword) {
				setError('Passwords do not match');
				return;
			}
			await signUp(email, password);
			// Note: User will need to verify their email
			navigation.navigate('SignIn');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>
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
			<TextInput
				style={styles.input}
				placeholder="Confirm Password"
				value={confirmPassword}
				onChangeText={setConfirmPassword}
				secureTextEntry
			/>
			<TouchableOpacity style={styles.button} onPress={handleSignUp}>
				<Text style={styles.buttonText}>Sign Up</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
				<Text style={styles.link}>Already have an account? Sign In</Text>
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