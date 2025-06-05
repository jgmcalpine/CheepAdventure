import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from '../../services/supabase';
import { RootStackScreenProps } from '../../types/navigation';

const signUpSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpScreen({ navigation }: RootStackScreenProps<'SignUp'>) {
	const [loading, setLoading] = useState(false);
	const { control, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = async (data: SignUpFormData) => {
		try {
			setLoading(true);
			const { error } = await signUp(data.email, data.password);
			if (error) throw error;
			Alert.alert(
				'Success',
				'Please check your email for verification instructions.',
				[{ text: 'OK', onPress: () => navigation.navigate('Login') }]
			);
		} catch (error) {
			Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>

			<Controller
				control={control}
				name="email"
				render={({ field: { onChange, value } }) => (
					<TextInput
						style={styles.input}
						placeholder="Email"
						autoCapitalize="none"
						keyboardType="email-address"
						onChangeText={onChange}
						value={value}
					/>
				)}
			/>
			{errors.email && (
				<Text style={styles.errorText}>{errors.email.message}</Text>
			)}

			<Controller
				control={control}
				name="password"
				render={({ field: { onChange, value } }) => (
					<TextInput
						style={styles.input}
						placeholder="Password"
						secureTextEntry
						onChangeText={onChange}
						value={value}
					/>
				)}
			/>
			{errors.password && (
				<Text style={styles.errorText}>{errors.password.message}</Text>
			)}

			<Controller
				control={control}
				name="confirmPassword"
				render={({ field: { onChange, value } }) => (
					<TextInput
						style={styles.input}
						placeholder="Confirm Password"
						secureTextEntry
						onChangeText={onChange}
						value={value}
					/>
				)}
			/>
			{errors.confirmPassword && (
				<Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
			)}

			<TouchableOpacity
				style={[styles.button, loading && styles.buttonDisabled]}
				onPress={handleSubmit(onSubmit)}
				disabled={loading}
			>
				<Text style={styles.buttonText}>
					{loading ? 'Creating account...' : 'Create Account'}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.linkButton}
				onPress={() => navigation.navigate('Login')}
			>
				<Text style={styles.linkText}>
					Already have an account? Sign in
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
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
		borderRadius: 8,
		marginBottom: 10,
	},
	errorText: {
		color: 'red',
		marginBottom: 10,
	},
	button: {
		backgroundColor: '#f4511e',
		padding: 15,
		borderRadius: 8,
		marginTop: 10,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: '#fff',
		textAlign: 'center',
		fontWeight: 'bold',
	},
	linkButton: {
		marginTop: 20,
	},
	linkText: {
		color: '#f4511e',
		textAlign: 'center',
	},
}); 