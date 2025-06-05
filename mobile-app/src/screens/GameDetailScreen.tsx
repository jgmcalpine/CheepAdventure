import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { audioService } from '../services/audio';

type GameDetailRouteProp = RouteProp<RootStackParamList, 'GameDetail'>;

type Play = {
	id: string;
	game_id: string;
	play_id: string;
	sequence_number: number;
	inning: number;
	inning_half: string;
	description: string;
	audio_url: string | null;
	audio_generated_at: string | null;
};

export default function GameDetailScreen() {
	const route = useRoute<GameDetailRouteProp>();
	const { gameId } = route.params;
	const [isListening, setIsListening] = useState(false);
	const [lastPlayedSequence, setLastPlayedSequence] = useState(0);

	// Fetch game details
	const { data: game } = useQuery({
		queryKey: ['game', gameId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('games')
				.select('*')
				.eq('id', gameId)
				.single();

			if (error) throw error;
			return data;
		},
	});

	// Fetch plays
	const {
		data: plays,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['plays', gameId],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('plays')
				.select('*')
				.eq('game_id', gameId)
				.order('sequence_number', { ascending: true });

			if (error) throw error;
			return data as Play[];
		},
		refetchInterval: game?.status === 'live' ? 5000 : false,
	});

	// Subscribe to new plays
	useEffect(() => {
		if (!isListening) return;

		const subscription = supabase
			.channel(`plays:${gameId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'plays',
					filter: `game_id=eq.${gameId}`,
				},
				async (payload) => {
					const newPlay = payload.new as Play;
					if (newPlay.sequence_number > lastPlayedSequence) {
						try {
							await audioService.addToQueue(newPlay.id, newPlay.description);
							setLastPlayedSequence(newPlay.sequence_number);
						} catch (error) {
							console.error('Error playing new play:', error);
						}
					}
				}
			)
			.subscribe();

		return () => {
			subscription.unsubscribe();
		};
	}, [gameId, isListening, lastPlayedSequence]);

	const toggleListening = async () => {
		if (isListening) {
			await audioService.stopAll();
			setIsListening(false);
		} else {
			setIsListening(true);
			// Start playing from the latest play
			const latestPlay = plays?.[plays.length - 1];
			if (latestPlay) {
				setLastPlayedSequence(latestPlay.sequence_number);
				await audioService.addToQueue(latestPlay.id, latestPlay.description);
			}
		}
	};

	const renderPlay = ({ item }: { item: Play }) => (
		<View style={styles.playCard}>
			<View style={styles.playHeader}>
				<Text style={styles.inning}>
					{item.inning_half} {item.inning}
				</Text>
				<Text style={styles.sequence}>#{item.sequence_number}</Text>
			</View>
			<Text style={styles.description}>{item.description}</Text>
		</View>
	);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color="#007AFF" />
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text style={styles.error}>Error loading game details</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.teams}>
					{game?.away_team} @ {game?.home_team}
				</Text>
				<Text style={styles.status}>{game?.status.toUpperCase()}</Text>
			</View>
			<TouchableOpacity
				style={[styles.listenButton, isListening && styles.listenButtonActive]}
				onPress={toggleListening}
			>
				<Text style={styles.listenButtonText}>
					{isListening ? 'Stop Listening' : 'Start Listening'}
				</Text>
			</TouchableOpacity>
			<FlatList
				data={plays}
				renderItem={renderPlay}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.playsList}
				inverted
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		padding: 15,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#ddd',
	},
	teams: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	status: {
		fontSize: 14,
		color: '#007AFF',
		textAlign: 'center',
		marginTop: 5,
	},
	listenButton: {
		backgroundColor: '#007AFF',
		padding: 15,
		margin: 10,
		borderRadius: 10,
	},
	listenButtonActive: {
		backgroundColor: '#ff3b30',
	},
	listenButtonText: {
		color: 'white',
		textAlign: 'center',
		fontWeight: 'bold',
	},
	playsList: {
		padding: 10,
	},
	playCard: {
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 10,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	playHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 5,
	},
	inning: {
		color: '#666',
		fontSize: 12,
	},
	sequence: {
		color: '#666',
		fontSize: 12,
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
	},
	error: {
		color: 'red',
		textAlign: 'center',
	},
}); 