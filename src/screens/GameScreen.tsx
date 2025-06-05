import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { fetchGameDetails, fetchGameUpdates, type Game } from '@/services/mlbApi';
import { convertPlayToSpeech } from '@/services/elevenlabs';
import { useAudio } from '@/contexts/AudioContext';
import type { RootStackParamList } from '@/types/navigation';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
  const route = useRoute<GameScreenRouteProp>();
  const { gameId } = route.params;
  const { isPlaying, startListening, stopListening, addToQueue } = useAudio();
  const [error, setError] = useState<string | null>(null);

  const {
    data: game,
    isLoading: isLoadingGame,
  } = useQuery<Game | null>({
    queryKey: ['game', gameId],
    queryFn: () => fetchGameDetails(gameId),
    refetchInterval: 10000,
    enabled: true,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchAndPlayUpdates = async () => {
      try {
        const updates = await fetchGameUpdates(gameId);
        for (const update of updates) {
          const audioUrl = await convertPlayToSpeech(update);
          addToQueue(audioUrl);
        }
      } catch (err) {
        setError('Failed to fetch game updates');
        console.error('Error fetching game updates:', err);
      }
    };

    if (game?.status === 'live') {
      startListening(gameId);
      interval = setInterval(fetchAndPlayUpdates, 15000);
      fetchAndPlayUpdates(); // Initial fetch
    }

    return () => {
      if (interval) clearInterval(interval);
      stopListening();
    };
  }, [gameId, game?.status, startListening, stopListening, addToQueue]);

  if (isLoadingGame) {
    return (
      <View style={styles.container}>
        <Text>Loading game details...</Text>
      </View>
    );
  }

  if (!game) {
    return (
      <View style={styles.container}>
        <Text>Game not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scoreBoard}>
        <View style={styles.teamScore}>
          <Text style={styles.teamName}>{game.awayTeam.name}</Text>
          <Text style={styles.score}>{game.awayTeam.score}</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.teamScore}>
          <Text style={styles.teamName}>{game.homeTeam.name}</Text>
          <Text style={styles.score}>{game.homeTeam.score}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[
          styles.status,
          game.status === 'live' && styles.liveStatus,
        ]}>
          {game.status.toUpperCase()}
        </Text>
      </View>

      {game.status === 'live' && (
        <View style={styles.audioSection}>
          <Text style={styles.audioTitle}>
            {isPlaying ? 'Listening to play-by-play...' : 'Ready to stream'}
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
          {game.lastPlay && (
            <View style={styles.lastPlayContainer}>
              <Text style={styles.lastPlayLabel}>Last Play:</Text>
              <Text style={styles.lastPlayText}>{game.lastPlay}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  vs: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  liveStatus: {
    backgroundColor: '#f4511e',
    color: '#fff',
  },
  audioSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  audioTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  error: {
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 16,
  },
  lastPlayContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  lastPlayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  lastPlayText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
  },
}); 