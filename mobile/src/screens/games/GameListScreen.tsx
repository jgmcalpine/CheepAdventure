import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { RootStackParamList } from '@/types/navigation';
import { fetchTodayGames, Game } from '@/services/games';

export default function GameListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const {
    data: games,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['games'],
    queryFn: fetchTodayGames,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    // Initial fetch
    void refetch();
  }, [refetch]);

  const renderGameItem = ({ item: game }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameStatus}>{game.status.toUpperCase()}</Text>
        {game.inning && game.inning_half && (
          <Text style={styles.inning}>
            {game.inning_half === 'top' ? '▲' : '▼'} {game.inning}
          </Text>
        )}
      </View>

      <View style={styles.teamsContainer}>
        <Text style={styles.teamName}>{game.away_team}</Text>
        <Text style={styles.vsText}>@</Text>
        <Text style={styles.teamName}>{game.home_team}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load games</Text>
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
        renderItem={renderGameItem}
        keyExtractor={(game) => game.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading || isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No games scheduled for today</Text>
            </View>
          )
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
  listContent: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  inning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  vsText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 