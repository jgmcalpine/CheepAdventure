import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@/hooks/useAuth';

const profileSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must be at most 20 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
	const { profile, updateProfile, signOut } = useAuth();
	const [isUpdating, setIsUpdating] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<ProfileForm>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			username: profile?.username || '',
		},
	});

	const onSubmit = async (data: ProfileForm) => {
		try {
			setIsUpdating(true);
			await updateProfile(data);
			Alert.alert('Success', 'Profile updated successfully');
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Failed to sign out');
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Profile Settings</Text>
				<Controller
					control={control}
					name="username"
					render={({ field: { onChange, value } }) => (
						<View style={styles.inputContainer}>
							<Text style={styles.label}>Username</Text>
							<TextInput
								style={styles.input}
								placeholder="Enter username"
								autoCapitalize="none"
								autoComplete="username"
								value={value}
								onChangeText={onChange}
							/>
							{errors.username && (
								<Text style={styles.fieldError}>
									{errors.username.message}
								</Text>
							)}
						</View>
					)}
				/>

				<TouchableOpacity
					style={[styles.button, isUpdating && styles.buttonDisabled]}
					onPress={handleSubmit(onSubmit)}
					disabled={isUpdating}
				>
					<Text style={styles.buttonText}>
						{isUpdating ? 'Updating...' : 'Update Profile'}
					</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account</Text>
				<Text style={styles.email}>{profile?.id}</Text>

				<TouchableOpacity
					style={[styles.button, styles.signOutButton]}
					onPress={handleSignOut}
				>
					<Text style={styles.buttonText}>Sign Out</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>App Information</Text>
				<Text style={styles.version}>Version 1.0.0</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
		padding: 16,
	},
	section: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
		color: '#212529',
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		color: '#495057',
		marginBottom: 8,
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
		alignItems: 'center',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	signOutButton: {
		backgroundColor: '#dc3545',
		marginTop: 8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	fieldError: {
		color: '#dc3545',
		fontSize: 12,
		marginTop: 4,
	},
	email: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
	},
	version: {
		fontSize: 14,
		color: '#666',
	},
}); 