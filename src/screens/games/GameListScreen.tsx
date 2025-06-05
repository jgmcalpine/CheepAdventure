import { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { getTodaysGames } from '@/lib/supabase';
import type { Game } from '@/lib/supabase';
import type { RootStackParamList } from '@/types/navigation';

export default function GameListScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const {
		data: games,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ['todaysGames'],
		queryFn: getTodaysGames,
		refetchInterval: 30000, // Refetch every 30 seconds
	});

	const renderGameStatus = useCallback((status: Game['status'], inning?: number, inningHalf?: string) => {
		switch (status) {
			case 'live':
				return `${inningHalf === 'top' ? '▲' : '▼'} ${inning}`;
			case 'final':
				return 'Final';
			default:
				return 'Scheduled';
		}
	}, []);

	const renderItem = useCallback(({ item: game }: { item: Game }) => (
		<TouchableOpacity
			style={styles.gameCard}
			onPress={() =>
				navigation.navigate('GameDetail', {
					gameId: game.id,
					homeTeam: game.home_team,
					awayTeam: game.away_team,
				})
			}
		>
			<View style={styles.gameInfo}>
				<Text style={styles.teamName}>{game.away_team}</Text>
				<Text style={styles.vsText}>@</Text>
				<Text style={styles.teamName}>{game.home_team}</Text>
			</View>
			<View style={styles.statusContainer}>
				<Text
					style={[
						styles.status,
						game.status === 'live' && styles.liveStatus,
						game.status === 'final' && styles.finalStatus,
					]}
				>
					{renderGameStatus(game.status, game.inning, game.inning_half)}
				</Text>
			</View>
		</TouchableOpacity>
	), [navigation, renderGameStatus]);

	if (isError) {
		return (
			<View style={styles.container}>
				<Text style={styles.error}>
					{error instanceof Error ? error.message : 'Failed to load games'}
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
					<Text style={styles.retryText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={games}
				renderItem={renderItem}
				keyExtractor={(game) => game.id}
				contentContainerStyle={styles.list}
				refreshControl={
					<RefreshControl refreshing={isLoading} onRefresh={refetch} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							{isLoading ? 'Loading games...' : 'No games scheduled for today'}
						</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	list: {
		padding: 16,
	},
	gameCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	gameInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	teamName: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
		textAlign: 'center',
	},
	vsText: {
		fontSize: 14,
		color: '#666',
		marginHorizontal: 8,
	},
	statusContainer: {
		alignItems: 'center',
	},
	status: {
		fontSize: 14,
		color: '#666',
		fontWeight: '500',
	},
	liveStatus: {
		color: '#28a745',
		fontWeight: '600',
	},
	finalStatus: {
		color: '#dc3545',
	},
	error: {
		textAlign: 'center',
		color: '#dc3545',
		marginTop: 20,
		marginHorizontal: 20,
	},
	retryButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		marginTop: 12,
		alignSelf: 'center',
	},
	retryText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 32,
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
}); 