import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/hooks/useAuth';
import type { RootStackParamList } from '@/types/navigation';

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { signIn } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginForm) => {
		try {
			setError(null);
			await signIn(data.email, data.password);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sign in');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Welcome Back</Text>

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

			<TouchableOpacity
				style={[styles.button, isSubmitting && styles.buttonDisabled]}
				onPress={handleSubmit(onSubmit)}
				disabled={isSubmitting}
			>
				<Text style={styles.buttonText}>
					{isSubmitting ? 'Signing in...' : 'Sign In'}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.link}
				onPress={() => navigation.navigate('SignUp')}
			>
				<Text style={styles.linkText}>Don't have an account? Sign up</Text>
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