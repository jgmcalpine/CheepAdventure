import { Game, Play } from './supabase';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

export type MLBGame = {
	gamePk: number;
	gameDate: string;
	status: {
		detailedState: string;
	};
	teams: {
		home: {
			team: {
				name: string;
			};
		};
		away: {
			team: {
				name: string;
			};
		};
	};
};

export type MLBPlay = {
	about: {
		atBatIndex: number;
		inning: number;
		halfInning: 'top' | 'bottom';
	};
	result: {
		description: string;
	};
	playEvents: Array<{
		details?: {
			description?: string;
		};
	}>;
};

// Helper function to convert MLB game data to our Game type
const convertMLBGame = (mlbGame: MLBGame): Omit<Game, 'created_at' | 'updated_at'> => ({
	id: mlbGame.gamePk.toString(),
	game_date: new Date(mlbGame.gameDate).toISOString().split('T')[0],
	home_team: mlbGame.teams.home.team.name,
	away_team: mlbGame.teams.away.team.name,
	status: mlbGame.status.detailedState.toLowerCase() as Game['status'],
	inning: undefined,
	inning_half: undefined,
});

// Helper function to convert MLB play data to our Play type
const convertMLBPlay = (mlbPlay: MLBPlay, gameId: string): Omit<Play, 'id' | 'audio_url' | 'audio_generated_at' | 'created_at'> => ({
	game_id: gameId,
	play_id: mlbPlay.about.atBatIndex.toString(),
	sequence_number: mlbPlay.about.atBatIndex,
	inning: mlbPlay.about.inning,
	inning_half: mlbPlay.about.halfInning,
	description: mlbPlay.result.description || mlbPlay.playEvents[0]?.details?.description || 'Play occurred',
});

// Fetch today's games
export const fetchTodaysGames = async (): Promise<MLBGame[]> => {
	const today = new Date().toISOString().split('T')[0];
	const response = await fetch(
		`${MLB_API_BASE}/schedule?sportId=1&date=${today}&hydrate=game(content(editorial(recap))),decisions`
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch games: ${response.statusText}`);
	}

	const data = await response.json();
	return data.dates.flatMap((date: { games: MLBGame[] }) => date.games);
};

// Fetch plays for a specific game
export const fetchGamePlays = async (gameId: string): Promise<MLBPlay[]> => {
	const response = await fetch(`${MLB_API_BASE}/game/${gameId}/playByPlay`);

	if (!response.ok) {
		throw new Error(`Failed to fetch plays: ${response.statusText}`);
	}

	const data = await response.json();
	return data.allPlays || [];
};

// Fetch live game data
export const fetchLiveGameData = async (gameId: string) => {
	const response = await fetch(`${MLB_API_BASE}/game/${gameId}/feed/live`);

	if (!response.ok) {
		throw new Error(`Failed to fetch live game data: ${response.statusText}`);
	}

	const data = await response.json();
	return {
		currentPlay: data.liveData.plays.currentPlay,
		allPlays: data.liveData.plays.allPlays,
		gameData: data.gameData,
		liveData: data.liveData,
	};
};

export const mlbApi = {
	convertMLBGame,
	convertMLBPlay,
	fetchTodaysGames,
	fetchGamePlays,
	fetchLiveGameData,
}; 