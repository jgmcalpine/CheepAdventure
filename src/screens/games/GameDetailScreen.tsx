import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { getGame, getGamePlays, startListeningSession, updateListeningSession } from '@/lib/supabase';
import { getAudioService } from '@/lib/audio-service';
import { useAuth } from '@/hooks/useAuth';
import type { RootStackParamList } from '@/types/navigation';
import type { Play } from '@/lib/supabase';

type GameDetailScreenRouteProp = RouteProp<RootStackParamList, 'GameDetail'>;

export default function GameDetailScreen() {
	const route = useRoute<GameDetailScreenRouteProp>();
	const { gameId } = route.params;
	const { profile } = useAuth();
	const [isListening, setIsListening] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [lastPlaySequence, setLastPlaySequence] = useState(0);

	// Fetch game details
	const {
		data: game,
		isLoading: isLoadingGame,
		error: gameError,
	} = useQuery({
		queryKey: ['game', gameId],
		queryFn: () => getGame(gameId),
	});

	// Fetch plays with auto-refresh for live games
	const {
		data: plays,
		isLoading: isLoadingPlays,
		error: playsError,
	} = useQuery({
		queryKey: ['plays', gameId],
		queryFn: () => getGamePlays(gameId),
		refetchInterval: game?.status === 'live' ? 5000 : false,
	});

	// Handle new plays
	useEffect(() => {
		if (!plays || !isListening) return;

		const newPlays = plays.filter((play) => play.sequence_number > lastPlaySequence);
		if (newPlays.length > 0) {
			const audioService = getAudioService();
			audioService.addMultipleToQueue(newPlays);
			setLastPlaySequence(Math.max(...newPlays.map((p) => p.sequence_number)));

			// Update listening session
			if (sessionId) {
				updateListeningSession(sessionId, {
					last_play_sequence: lastPlaySequence,
				});
			}
		}
	}, [plays, isListening, lastPlaySequence, sessionId]);

	const toggleListening = async () => {
		if (!profile) return;

		if (isListening) {
			// Stop listening
			const audioService = getAudioService();
			await audioService.clear();
			if (sessionId) {
				await updateListeningSession(sessionId, {
					ended_at: new Date().toISOString(),
					last_play_sequence: lastPlaySequence,
				});
			}
			setIsListening(false);
			setSessionId(null);
		} else {
			// Start listening
			const { id } = await startListeningSession(profile.id, gameId);
			setSessionId(id);
			setIsListening(true);

			// Queue up all plays from the beginning
			if (plays) {
				const audioService = getAudioService();
				audioService.addMultipleToQueue(plays);
				setLastPlaySequence(Math.max(...plays.map((p) => p.sequence_number)));
			}
		}
	};

	const renderPlay = (play: Play) => (
		<View key={play.id} style={styles.playCard}>
			<Text style={styles.inning}>
				{play.inning_half === 'top' ? '▲' : '▼'} {play.inning}
			</Text>
			<Text style={styles.playDescription}>{play.description}</Text>
		</View>
	);

	if (isLoadingGame || isLoadingPlays) {
		return (
			<View style={styles.container}>
				<Text style={styles.loadingText}>Loading game details...</Text>
			</View>
		);
	}

	if (gameError || playsError) {
		return (
			<View style={styles.container}>
				<Text style={styles.error}>
					{(gameError || playsError) instanceof Error
						? (gameError || playsError)?.message
						: 'Failed to load game details'}
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.scoreContainer}>
					<Text style={styles.teamName}>{game?.away_team}</Text>
					<Text style={styles.vsText}>@</Text>
					<Text style={styles.teamName}>{game?.home_team}</Text>
				</View>
				<View style={styles.statusContainer}>
					<Text
						style={[
							styles.status,
							game?.status === 'live' && styles.liveStatus,
							game?.status === 'final' && styles.finalStatus,
						]}
					>
						{game?.status.toUpperCase()}
					</Text>
					{game?.status === 'live' && (
						<Text style={styles.inningStatus}>
							{game.inning_half === 'top' ? '▲' : '▼'} {game.inning}
						</Text>
					)}
				</View>
			</View>

			<TouchableOpacity
				style={[styles.listenButton, isListening && styles.stopButton]}
				onPress={toggleListening}
				disabled={game?.status === 'scheduled'}
			>
				<Text style={styles.listenButtonText}>
					{isListening ? 'Stop Listening' : 'Start Listening'}
				</Text>
			</TouchableOpacity>

			<ScrollView style={styles.playsContainer}>
				{plays?.map(renderPlay)}
				{plays?.length === 0 && (
					<Text style={styles.noPlaysText}>No plays available yet</Text>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	header: {
		backgroundColor: '#fff',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e9ecef',
	},
	scoreContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	teamName: {
		fontSize: 20,
		fontWeight: 'bold',
		flex: 1,
		textAlign: 'center',
	},
	vsText: {
		fontSize: 16,
		color: '#666',
		marginHorizontal: 12,
	},
	statusContainer: {
		alignItems: 'center',
	},
	status: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
	},
	liveStatus: {
		color: '#28a745',
	},
	finalStatus: {
		color: '#dc3545',
	},
	inningStatus: {
		fontSize: 16,
		fontWeight: '600',
		color: '#212529',
		marginTop: 4,
	},
	listenButton: {
		backgroundColor: '#28a745',
		margin: 16,
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	stopButton: {
		backgroundColor: '#dc3545',
	},
	listenButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	playsContainer: {
		flex: 1,
		padding: 16,
	},
	playCard: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 12,
		marginBottom: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	inning: {
		fontSize: 12,
		color: '#666',
		marginBottom: 4,
	},
	playDescription: {
		fontSize: 14,
		color: '#212529',
	},
	loadingText: {
		textAlign: 'center',
		marginTop: 20,
		color: '#666',
		fontSize: 16,
	},
	error: {
		textAlign: 'center',
		marginTop: 20,
		color: '#dc3545',
		fontSize: 16,
		paddingHorizontal: 20,
	},
	noPlaysText: {
		textAlign: 'center',
		color: '#666',
		fontSize: 16,
		marginTop: 20,
	},
}); 