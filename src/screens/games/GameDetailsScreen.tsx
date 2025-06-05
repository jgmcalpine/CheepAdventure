import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';
import { fetchGameDetails } from '../../services/mlbApi';
import { RootStackScreenProps } from '../../types/navigation';

export default function GameDetailsScreen({
	route,
	navigation,
}: RootStackScreenProps<'GameDetails'>) {
	const { gameId, homeTeam, awayTeam } = route.params;
	const [sound, setSound] = useState<Audio.Sound | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const { data: gameDetails, isLoading, isError } = useQuery({
		queryKey: ['gameDetails', gameId],
		queryFn: () => fetchGameDetails(parseInt(gameId)),
	});

	useEffect(() => {
		return () => {
			if (sound) {
				sound.unloadAsync();
			}
		};
	}, [sound]);

	const handlePlayPause = async () => {
		try {
			if (sound) {
				if (isPlaying) {
					await sound.pauseAsync();
					setIsPlaying(false);
				} else {
					await sound.playAsync();
					setIsPlaying(true);
				}
			} else {
				// TODO: Replace with actual audio stream URL
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri: 'https://example.com/audio-stream' },
					{ shouldPlay: true }
				);
				setSound(newSound);
				setIsPlaying(true);

				newSound.setOnPlaybackStatusUpdate((status) => {
					if (status.isLoaded) {
						if (!status.isPlaying && status.didJustFinish) {
							setIsPlaying(false);
						}
					}
				});
			}
		} catch (error) {
			Alert.alert('Error', 'Failed to play audio');
			console.error(error);
		}
	};

	if (isLoading) {
		return (
			<View style={styles.centerContainer}>
				<Text>Loading game details...</Text>
			</View>
		);
	}

	if (isError || !gameDetails) {
		return (
			<View style={styles.centerContainer}>
				<Text style={styles.errorText}>Failed to load game details</Text>
			</View>
		);
	}

	const { home, away } = gameDetails.teams;
	const isLive = gameDetails.status.abstractGameState === 'Live';

	return (
		<ScrollView style={styles.container}>
			<View style={styles.scoreboardContainer}>
				<View style={styles.teamScore}>
					<Text style={styles.teamName}>{away.team.name}</Text>
					<Text style={styles.score}>{away.score}</Text>
				</View>
				<Text style={styles.vs}>VS</Text>
				<View style={styles.teamScore}>
					<Text style={styles.teamName}>{home.team.name}</Text>
					<Text style={styles.score}>{home.score}</Text>
				</View>
			</View>

			<View style={styles.infoContainer}>
				<Text style={styles.venue}>{gameDetails.venue.name}</Text>
				<Text style={styles.status}>
					{gameDetails.status.detailedState}
				</Text>
			</View>

			{isLive && (
				<View style={styles.audioContainer}>
					<Text style={styles.audioTitle}>Live Play-by-Play Audio</Text>
					<TouchableOpacity
						style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]}
						onPress={handlePlayPause}
					>
						<Text style={styles.audioButtonText}>
							{isPlaying ? 'Pause' : 'Play'}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* TODO: Add game stats and play-by-play text updates */}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: '#dc3545',
		fontSize: 16,
	},
	scoreboardContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#f8f9fa',
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	teamScore: {
		alignItems: 'center',
	},
	teamName: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	score: {
		fontSize: 32,
		fontWeight: 'bold',
	},
	vs: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#666',
	},
	infoContainer: {
		padding: 20,
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	venue: {
		fontSize: 16,
		color: '#666',
		marginBottom: 8,
	},
	status: {
		fontSize: 16,
		fontWeight: '500',
		color: '#f4511e',
	},
	audioContainer: {
		padding: 20,
		alignItems: 'center',
	},
	audioTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	audioButton: {
		backgroundColor: '#f4511e',
		paddingHorizontal: 40,
		paddingVertical: 15,
		borderRadius: 25,
	},
	audioButtonPlaying: {
		backgroundColor: '#dc3545',
	},
	audioButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
}); 