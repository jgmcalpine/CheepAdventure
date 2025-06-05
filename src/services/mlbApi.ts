import { z } from 'zod';

const baseUrl = 'https://statsapi.mlb.com/api/v1';

// Types for MLB API responses
const TeamSchema = z.object({
	id: z.number(),
	name: z.string(),
	teamName: z.string(),
	abbreviation: z.string(),
});

const GameStatusSchema = z.object({
	abstractGameState: z.string(),
	detailedState: z.string(),
	startTimeTBD: z.boolean(),
});

const GameSchema = z.object({
	gamePk: z.number(),
	gameDate: z.string(),
	status: GameStatusSchema,
	teams: z.object({
		away: z.object({
			score: z.number(),
			team: TeamSchema,
		}),
		home: z.object({
			score: z.number(),
			team: TeamSchema,
		}),
	}),
	venue: z.object({
		id: z.number(),
		name: z.string(),
	}),
});

const ScheduleResponseSchema = z.object({
	dates: z.array(z.object({
		games: z.array(GameSchema),
	})),
});

export type Game = z.infer<typeof GameSchema>;

// Helper function to format date for MLB API
const formatDate = (date: Date): string => {
	return date.toISOString().split('T')[0];
};

// Fetch live and upcoming games
export const fetchGames = async (): Promise<Game[]> => {
	try {
		const today = formatDate(new Date());
		const response = await fetch(
			`${baseUrl}/schedule?sportId=1&date=${today}&hydrate=team,venue`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch games');
		}

		const data = await response.json();
		const parsed = ScheduleResponseSchema.parse(data);

		// Flatten the games array from all dates
		return parsed.dates.flatMap(date => date.games);
	} catch (error) {
		console.error('Error fetching games:', error);
		throw error;
	}
};

// Fetch game details by ID
export const fetchGameDetails = async (gameId: number): Promise<Game> => {
	try {
		const response = await fetch(
			`${baseUrl}/game/${gameId}/feed/live`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch game details');
		}

		const data = await response.json();
		return GameSchema.parse(data.gameData);
	} catch (error) {
		console.error('Error fetching game details:', error);
		throw error;
	}
}; 