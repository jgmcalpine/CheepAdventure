import React from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGames } from '../../services/mlbApi';
import type { Game } from '../../services/mlbApi';
import { RootStackScreenProps } from '../../types/navigation';

export default function GamesListScreen({ navigation }: RootStackScreenProps<'GamesList'>) {
	const {
		data: games,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery({
		queryKey: ['games'],
		queryFn: fetchGames,
	});

	const renderGameItem = ({ item }: { item: Game }) => {
		const { home, away } = item.teams;
		const isLive = item.status.abstractGameState === 'Live';

		return (
			<TouchableOpacity
				style={[styles.gameCard, isLive && styles.liveGameCard]}
				onPress={() => navigation.navigate('GameDetails', {
					gameId: item.gamePk.toString(),
					homeTeam: home.team.name,
					awayTeam: away.team.name,
				})}
			>
				<View style={styles.gameHeader}>
					<Text style={styles.gameTime}>
						{new Date(item.gameDate).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</Text>
					{isLive && <Text style={styles.liveIndicator}>LIVE</Text>}
				</View>

				<View style={styles.teamContainer}>
					<View style={styles.teamInfo}>
						<Text style={styles.teamName}>{away.team.name}</Text>
						<Text style={styles.score}>{away.score}</Text>
					</View>
					<View style={styles.teamInfo}>
						<Text style={styles.teamName}>{home.team.name}</Text>
						<Text style={styles.score}>{home.score}</Text>
					</View>
				</View>

				<Text style={styles.venue}>{item.venue.name}</Text>
			</TouchableOpacity>
		);
	};

	if (isError) {
		return (
			<View style={styles.centerContainer}>
				<Text style={styles.errorText}>
					{error instanceof Error ? error.message : 'An error occurred'}
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={games}
				renderItem={renderGameItem}
				keyExtractor={(item) => item.gamePk.toString()}
				refreshControl={
					<RefreshControl refreshing={isLoading} onRefresh={refetch} />
				}
				ListEmptyComponent={
					<View style={styles.centerContainer}>
						<Text style={styles.emptyText}>
							{isLoading ? 'Loading games...' : 'No games scheduled'}
						</Text>
					</View>
				}
				contentContainerStyle={styles.listContent}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	listContent: {
		padding: 16,
	},
	gameCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	liveGameCard: {
		borderColor: '#f4511e',
		borderWidth: 2,
	},
	gameHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	gameTime: {
		fontSize: 14,
		color: '#666',
	},
	liveIndicator: {
		backgroundColor: '#f4511e',
		color: '#fff',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		fontSize: 12,
		fontWeight: 'bold',
	},
	teamContainer: {
		marginBottom: 12,
	},
	teamInfo: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	teamName: {
		fontSize: 16,
		fontWeight: '500',
	},
	score: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	venue: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#dc3545',
		textAlign: 'center',
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
	retryButton: {
		backgroundColor: '#f4511e',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
}); 