import { supabase } from './supabase';

/**
 * Event types for analytics tracking
 */
export enum AnalyticsEventType {
	// User events
	USER_SIGNUP = 'user_signup',
	USER_LOGIN = 'user_login',
	USER_LOGOUT = 'user_logout',

	// Game events
	GAME_VIEW = 'game_view',
	GAME_LISTEN_START = 'game_listen_start',
	GAME_LISTEN_END = 'game_listen_end',
	PLAY_HEARD = 'play_heard',

	// System events
	AUDIO_GENERATION_SUCCESS = 'audio_generation_success',
	AUDIO_GENERATION_ERROR = 'audio_generation_error',
	API_ERROR = 'api_error'
}

/**
 * Analytics service for tracking user engagement and system performance
 */
export class Analytics {
	/**
	 * Track a user event
	 * @param eventType The type of event to track
	 * @param eventData Additional data about the event
	 */
	static async trackEvent(eventType: AnalyticsEventType, eventData: Record<string, any> = {}) {
		try {
			const { error } = await supabase.from('analytics_events').insert({
				event_type: eventType,
				event_data: eventData
			});

			if (error) {
				console.error('Failed to track analytics event:', error);
			}
		} catch (err) {
			console.error('Error tracking analytics event:', err);
		}
	}

	/**
	 * Track when a user starts listening to a game
	 * @param gameId The ID of the game
	 * @param userId The ID of the user
	 */
	static async trackGameListenStart(gameId: string, userId: string) {
		await this.trackEvent(AnalyticsEventType.GAME_LISTEN_START, {
			game_id: gameId,
			user_id: userId
		});
	}

	/**
	 * Track when a user stops listening to a game
	 * @param gameId The ID of the game
	 * @param userId The ID of the user
	 * @param duration Duration of the listening session in seconds
	 */
	static async trackGameListenEnd(gameId: string, userId: string, duration: number) {
		await this.trackEvent(AnalyticsEventType.GAME_LISTEN_END, {
			game_id: gameId,
			user_id: userId,
			duration
		});
	}

	/**
	 * Track when a play is heard by a user
	 * @param playId The ID of the play
	 * @param gameId The ID of the game
	 * @param userId The ID of the user
	 */
	static async trackPlayHeard(playId: string, gameId: string, userId: string) {
		await this.trackEvent(AnalyticsEventType.PLAY_HEARD, {
			play_id: playId,
			game_id: gameId,
			user_id: userId
		});
	}

	/**
	 * Track successful audio generation
	 * @param playId The ID of the play
	 * @param duration Time taken to generate audio in milliseconds
	 */
	static async trackAudioGenerationSuccess(playId: string, duration: number) {
		await this.trackEvent(AnalyticsEventType.AUDIO_GENERATION_SUCCESS, {
			play_id: playId,
			duration
		});
	}

	/**
	 * Track failed audio generation
	 * @param playId The ID of the play
	 * @param error The error message
	 */
	static async trackAudioGenerationError(playId: string, error: string) {
		await this.trackEvent(AnalyticsEventType.AUDIO_GENERATION_ERROR, {
			play_id: playId,
			error
		});
	}

	/**
	 * Track API errors
	 * @param endpoint The API endpoint that failed
	 * @param error The error message
	 * @param statusCode The HTTP status code (if applicable)
	 */
	static async trackApiError(endpoint: string, error: string, statusCode?: number) {
		await this.trackEvent(AnalyticsEventType.API_ERROR, {
			endpoint,
			error,
			status_code: statusCode
		});
	}
} 