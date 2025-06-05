import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../services/supabase';
import { RootStackScreenProps } from '../../types/navigation';

export default function ProfileScreen({ navigation }: RootStackScreenProps<'Profile'>) {
	const { user } = useAuth();

	const handleSignOut = async () => {
		try {
			const { error } = await signOut();
			if (error) throw error;
		} catch (error) {
			Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.profileInfo}>
				<Text style={styles.title}>Profile</Text>
				<Text style={styles.email}>{user?.email}</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Account Settings</Text>
				<TouchableOpacity style={styles.button}>
					<Text style={styles.buttonText}>Change Password</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button}>
					<Text style={styles.buttonText}>Notification Preferences</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>App Settings</Text>
				<TouchableOpacity style={styles.button}>
					<Text style={styles.buttonText}>Audio Quality</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button}>
					<Text style={styles.buttonText}>Theme</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity
				style={[styles.button, styles.signOutButton]}
				onPress={handleSignOut}
			>
				<Text style={[styles.buttonText, styles.signOutText]}>Sign Out</Text>
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
	profileInfo: {
		alignItems: 'center',
		marginBottom: 30,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	email: {
		fontSize: 16,
		color: '#666',
	},
	section: {
		marginBottom: 30,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
		color: '#333',
	},
	button: {
		backgroundColor: '#f8f9fa',
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	buttonText: {
		color: '#333',
		fontSize: 16,
	},
	signOutButton: {
		backgroundColor: '#dc3545',
		borderColor: '#dc3545',
		marginTop: 'auto',
	},
	signOutText: {
		color: '#fff',
		textAlign: 'center',
		fontWeight: 'bold',
	},
}); 