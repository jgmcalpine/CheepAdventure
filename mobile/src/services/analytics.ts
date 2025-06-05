import { supabase } from './supabase';

export type EventType =
  | 'app_open'
  | 'app_close'
  | 'game_view'
  | 'game_listen_start'
  | 'game_listen_end'
  | 'play_heard'
  | 'error_occurred'
  | 'audio_failed'
  | 'api_error';

export interface EventData {
  [key: string]: unknown;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionStartTime: number;
  private currentGameId: string | null;
  private playsHeard: number;

  private constructor() {
    this.sessionStartTime = Date.now();
    this.currentGameId = null;
    this.playsHeard = 0;
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async trackEvent(eventType: EventType, eventData: EventData = {}): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_data: {
          ...eventData,
          timestamp: new Date().toISOString(),
          session_duration: Date.now() - this.sessionStartTime,
        },
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  public async trackAppOpen(): Promise<void> {
    await this.trackEvent('app_open');
  }

  public async trackAppClose(): Promise<void> {
    await this.trackEvent('app_close', {
      total_plays_heard: this.playsHeard,
      session_duration: Date.now() - this.sessionStartTime,
    });
  }

  public async trackGameView(gameId: string, homeTeam: string, awayTeam: string): Promise<void> {
    await this.trackEvent('game_view', {
      game_id: gameId,
      home_team: homeTeam,
      away_team: awayTeam,
    });
  }

  public async trackGameListenStart(gameId: string): Promise<void> {
    this.currentGameId = gameId;
    await this.trackEvent('game_listen_start', {
      game_id: gameId,
    });
  }

  public async trackGameListenEnd(gameId: string, lastPlaySequence: number): Promise<void> {
    await this.trackEvent('game_listen_end', {
      game_id: gameId,
      last_play_sequence: lastPlaySequence,
      total_plays_heard: this.playsHeard,
    });
    this.currentGameId = null;
    this.playsHeard = 0;
  }

  public async trackPlayHeard(
    playId: string,
    gameId: string,
    sequenceNumber: number
  ): Promise<void> {
    this.playsHeard++;
    await this.trackEvent('play_heard', {
      play_id: playId,
      game_id: gameId,
      sequence_number: sequenceNumber,
    });
  }

  public async trackError(
    errorType: 'audio' | 'api' | 'general',
    error: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    const eventType = errorType === 'audio'
      ? 'audio_failed'
      : errorType === 'api'
      ? 'api_error'
      : 'error_occurred';

    await this.trackEvent(eventType, {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  public async trackPerformanceMetric(
    metricName: string,
    value: number,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.trackEvent('performance_metric' as EventType, {
      metric_name: metricName,
      value,
      ...context,
    });
  }
}

export const analytics = AnalyticsService.getInstance(); 