import env from '../config/env';

export interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  inning?: number;
  inningHalf?: 'top' | 'bottom';
}

export interface Play {
  id: string;
  gameId: string;
  sequenceNumber: number;
  inning: number;
  inningHalf: 'top' | 'bottom';
  description: string;
}

interface MLBScheduleResponse {
  dates: Array<{
    games: Array<{
      gamePk: number;
      status: { detailedState: string };
      teams: {
        home: { team: { name: string } };
        away: { team: { name: string } };
      };
      linescore?: {
        currentInning?: number;
        inningHalf?: string;
      };
    }>;
  }>;
}

interface MLBGameFeedResponse {
  liveData: {
    plays: {
      allPlays: Array<{
        about: {
          atBatIndex: number;
          inning: number;
          halfInning: string;
        };
        result: {
          description?: string;
        };
        playEvents: Array<{
          details?: {
            description?: string;
          };
        }>;
      }>;
    };
  };
}

class MLBApiService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheDuration: number = 30000; // 30 seconds cache

  constructor() {
    this.baseUrl = env.MLB_STATS_API_URL;
    this.cache = new Map();
  }

  private async fetchWithCache<T>(url: string, key: string): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data as T;
    }

    const response = await fetch(`${this.baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`MLB API error: ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data as T;
  }

  async getTodayGames(): Promise<Game[]> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.fetchWithCache<MLBScheduleResponse>(
      `/v1/schedule?sportId=1&date=${today}&hydrate=game(content(editorial(recap))),decisions`,
      `games_${today}`
    );

    return data.dates[0]?.games.map((game) => ({
      id: game.gamePk.toString(),
      date: today,
      homeTeam: game.teams.home.team.name,
      awayTeam: game.teams.away.team.name,
      status: game.status.detailedState.toLowerCase(),
      inning: game.linescore?.currentInning,
      inningHalf: game.linescore?.inningHalf?.toLowerCase() as 'top' | 'bottom' | undefined,
    })) || [];
  }

  async getGamePlays(gameId: string): Promise<Play[]> {
    const data = await this.fetchWithCache<MLBGameFeedResponse>(
      `/v1.1/game/${gameId}/feed/live`,
      `plays_${gameId}`
    );

    return data.liveData.plays.allPlays.map((play) => ({
      id: `${gameId}_${play.about.atBatIndex}`,
      gameId,
      sequenceNumber: play.about.atBatIndex,
      inning: play.about.inning,
      inningHalf: play.about.halfInning.toLowerCase() as 'top' | 'bottom',
      description: play.result.description || play.playEvents[0]?.details?.description || 'Play occurred',
    }));
  }
}

export const mlbApi = new MLBApiService(); 