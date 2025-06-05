import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { RootStackParamList } from '@/types/navigation';
import {
  fetchGamePlays,
  subscribeToGameUpdates,
  subscribeToNewPlays,
  startListeningSession,
  endListeningSession,
  Game,
  Play,
} from '@/services/games';
import { useAudioStore } from '@/services/audio';

type GameDetailRouteProp = RouteProp<RootStackParamList, 'GameDetail'>;

export default function GameDetailScreen() {
  const route = useRoute<GameDetailRouteProp>();
  const { gameId } = route.params;
  const [isListening, setIsListening] = useState(false);
  const [lastPlaySequence, setLastPlaySequence] = useState(0);
  const audioStore = useAudioStore();

  const {
    data: plays,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['plays', gameId],
    queryFn: () => fetchGamePlays(gameId),
    refetchInterval: isListening ? 5000 : false,
  });

  useEffect(() => {
    const unsubscribeGame = subscribeToGameUpdates(gameId, (game: Game) => {
      if (game.status === 'final') {
        void handleStopListening();
      }
    });

    const unsubscribePlays = subscribeToNewPlays(gameId, (play: Play) => {
      if (isListening && play.audio_url) {
        audioStore.addToQueue(play.audio_url);
        setLastPlaySequence(play.sequence_number);
      }
    });

    return () => {
      unsubscribeGame();
      unsubscribePlays();
    };
  }, [gameId, isListening]);

  const handleStartListening = async () => {
    try {
      await startListeningSession(gameId);
      setIsListening(true);
      
      // Queue up any existing plays that have audio
      plays?.forEach((play) => {
        if (play.audio_url) {
          audioStore.addToQueue(play.audio_url);
          setLastPlaySequence(play.sequence_number);
        }
      });
    } catch (error) {
      console.error('Error starting listening session:', error);
    }
  };

  const handleStopListening = async () => {
    try {
      await endListeningSession(gameId, lastPlaySequence);
      setIsListening(false);
      await audioStore.stopPlayback();
    } catch (error) {
      console.error('Error ending listening session:', error);
    }
  };

  const renderPlayItem = ({ item: play }: { item: Play }) => (
    <View style={styles.playCard}>
      <View style={styles.playHeader}>
        <Text style={styles.inningText}>
          {play.inning_half === 'top' ? '▲' : '▼'} {play.inning}
        </Text>
      </View>
      <Text style={styles.playDescription}>{play.description}</Text>
    </View>
  );

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load game details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.listenButton, isListening && styles.stopButton]}
        onPress={isListening ? handleStopListening : handleStartListening}
      >
        <Text style={styles.listenButtonText}>
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={plays}
          renderItem={renderPlayItem}
          keyExtractor={(play) => play.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No plays yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loading: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  playCard: {
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
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  playDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  listenButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  listenButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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