import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { fetchLiveGames } from '@/services/mlbApi';
import type { Game } from '@/services/mlbApi';
import type { RootStackParamList } from '@/types/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();

  const {
    data: games,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['games'],
    queryFn: fetchLiveGames,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, signOut]);

  const renderGameItem = ({ item: game }: { item: Game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => navigation.navigate('Game', { gameId: game.id, gameTitle: game.title })}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>{game.title}</Text>
        <Text style={[
          styles.gameStatus,
          game.status === 'live' && styles.liveStatus,
        ]}>
          {game.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{game.awayTeam.name}</Text>
          <Text style={styles.score}>{game.awayTeam.score}</Text>
        </View>
        <View style={styles.teamContainer}>
          <Text style={styles.teamName}>{game.homeTeam.name}</Text>
          <Text style={styles.score}>{game.homeTeam.score}</Text>
        </View>
      </View>

      {game.lastPlay && (
        <Text style={styles.lastPlay} numberOfLines={2}>
          {game.lastPlay}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading games...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading games. Please try again.</Text>
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
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No games available</Text>
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
  listContainer: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  liveStatus: {
    backgroundColor: '#f4511e',
    color: '#fff',
  },
  scoreContainer: {
    marginBottom: 12,
  },
  teamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    color: '#333',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  lastPlay: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  signOutButton: {
    marginRight: 16,
  },
  signOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
}); 