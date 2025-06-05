import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export default function ProfileScreen() {
	const { session, signOut } = useAuth();

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (error) {
			Alert.alert('Error', 'Failed to sign out');
		}
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			'Delete Account',
			'Are you sure you want to delete your account? This action cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const { error } = await supabase.auth.admin.deleteUser(
								session?.user.id ?? ''
							);
							if (error) throw error;
							await signOut();
						} catch (error) {
							Alert.alert('Error', 'Failed to delete account');
						}
					},
				},
			]
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.section}>
				<Text style={styles.label}>Email</Text>
				<Text style={styles.value}>{session?.user.email}</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account Settings</Text>
				<TouchableOpacity
					style={[styles.button, styles.dangerButton]}
					onPress={handleDeleteAccount}
				>
					<Text style={[styles.buttonText, styles.dangerButtonText]}>
						Delete Account
					</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity style={styles.button} onPress={handleSignOut}>
				<Text style={styles.buttonText}>Sign Out</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	section: {
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 10,
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
	},
	label: {
		fontSize: 14,
		color: '#666',
		marginBottom: 5,
	},
	value: {
		fontSize: 16,
		fontWeight: '500',
	},
	button: {
		backgroundColor: '#007AFF',
		padding: 15,
		borderRadius: 10,
		alignItems: 'center',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	dangerButton: {
		backgroundColor: '#fff',
		borderWidth: 1,
		borderColor: '#ff3b30',
	},
	dangerButtonText: {
		color: '#ff3b30',
	},
}); 