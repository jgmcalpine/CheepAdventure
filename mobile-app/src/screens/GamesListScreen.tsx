import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

type Game = {
	id: string;
	game_date: string;
	home_team: string;
	away_team: string;
	status: string;
	inning: number;
	inning_half: string;
};

type GamesListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GamesList'>;

export default function GamesListScreen() {
	const navigation = useNavigation<GamesListScreenNavigationProp>();

	const { data: games, isLoading, error, refetch } = useQuery<Game[]>({
		queryKey: ['games'],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('games')
				.select('*')
				.eq('game_date', new Date().toISOString().split('T')[0])
				.order('status', { ascending: false });

			if (error) throw error;
			return data;
		},
	});

	const renderGameItem = ({ item }: { item: Game }) => (
		<TouchableOpacity
			style={styles.gameCard}
			onPress={() => navigation.navigate('GameDetail', { gameId: item.id })}
		>
			<View style={styles.gameHeader}>
				<Text style={styles.status}>{item.status.toUpperCase()}</Text>
				{item.status === 'live' && (
					<Text style={styles.inning}>
						{item.inning_half} {item.inning}
					</Text>
				)}
			</View>
			<View style={styles.teams}>
				<Text style={styles.teamName}>{item.away_team}</Text>
				<Text style={styles.vs}>@</Text>
				<Text style={styles.teamName}>{item.home_team}</Text>
			</View>
		</TouchableOpacity>
	);

	if (error) {
		return (
			<View style={styles.container}>
				<Text style={styles.error}>Error loading games</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={games}
				renderItem={renderGameItem}
				keyExtractor={(item) => item.id}
				refreshControl={
					<RefreshControl refreshing={isLoading} onRefresh={refetch} />
				}
				ListEmptyComponent={
					<Text style={styles.emptyText}>
						{isLoading ? 'Loading games...' : 'No games scheduled for today'}
					</Text>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	gameCard: {
		backgroundColor: 'white',
		margin: 10,
		padding: 15,
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	gameHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	status: {
		color: '#007AFF',
		fontWeight: 'bold',
	},
	inning: {
		color: '#666',
	},
	teams: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	teamName: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	vs: {
		fontSize: 14,
		color: '#666',
		marginHorizontal: 10,
	},
	error: {
		color: 'red',
		textAlign: 'center',
		margin: 20,
	},
	emptyText: {
		textAlign: 'center',
		margin: 20,
		color: '#666',
	},
}); 