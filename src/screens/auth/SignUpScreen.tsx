import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/hooks/useAuth';
import type { RootStackParamList } from '@/types/navigation';

const signUpSchema = z.object({
	email: z.string().email('Invalid email address'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must be at most 20 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ['confirmPassword'],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUpScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { signUp } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
	});

	const onSubmit = async (data: SignUpForm) => {
		try {
			setError(null);
			await signUp(data.email, data.password, data.username);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sign up');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Create Account</Text>

			{error && <Text style={styles.error}>{error}</Text>}

			<Controller
				control={control}
				name="email"
				render={({ field: { onChange, value } }) => (
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.input}
							placeholder="Email"
							keyboardType="email-address"
							autoCapitalize="none"
							autoComplete="email"
							value={value}
							onChangeText={onChange}
						/>
						{errors.email && (
							<Text style={styles.fieldError}>{errors.email.message}</Text>
						)}
					</View>
				)}
			/>

			<Controller
				control={control}
				name="username"
				render={({ field: { onChange, value } }) => (
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.input}
							placeholder="Username"
							autoCapitalize="none"
							autoComplete="username"
							value={value}
							onChangeText={onChange}
						/>
						{errors.username && (
							<Text style={styles.fieldError}>{errors.username.message}</Text>
						)}
					</View>
				)}
			/>

			<Controller
				control={control}
				name="password"
				render={({ field: { onChange, value } }) => (
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.input}
							placeholder="Password"
							secureTextEntry
							value={value}
							onChangeText={onChange}
						/>
						{errors.password && (
							<Text style={styles.fieldError}>{errors.password.message}</Text>
						)}
					</View>
				)}
			/>

			<Controller
				control={control}
				name="confirmPassword"
				render={({ field: { onChange, value } }) => (
					<View style={styles.inputContainer}>
						<TextInput
							style={styles.input}
							placeholder="Confirm Password"
							secureTextEntry
							value={value}
							onChangeText={onChange}
						/>
						{errors.confirmPassword && (
							<Text style={styles.fieldError}>
								{errors.confirmPassword.message}
							</Text>
						)}
					</View>
				)}
			/>

			<TouchableOpacity
				style={[styles.button, isSubmitting && styles.buttonDisabled]}
				onPress={handleSubmit(onSubmit)}
				disabled={isSubmitting}
			>
				<Text style={styles.buttonText}>
					{isSubmitting ? 'Creating Account...' : 'Create Account'}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.link}
				onPress={() => navigation.navigate('Login')}
			>
				<Text style={styles.linkText}>Already have an account? Sign in</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
		justifyContent: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	inputContainer: {
		marginBottom: 15,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	button: {
		backgroundColor: '#007AFF',
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
		fontSize: 16,
		fontWeight: 'bold',
	},
	link: {
		marginTop: 15,
	},
	linkText: {
		color: '#007AFF',
		textAlign: 'center',
		fontSize: 16,
	},
	error: {
		color: '#ff3b30',
		textAlign: 'center',
		marginBottom: 15,
	},
	fieldError: {
		color: '#ff3b30',
		fontSize: 12,
		marginTop: 5,
	},
}); 