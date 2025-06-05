import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
		);

		// Fetch today's games from MLB StatsAPI
		const today = new Date().toISOString().split('T')[0];
		const response = await fetch(
			`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=game(content(editorial(recap))),decisions`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch MLB data');
		}

		const data = await response.json();

		// Sync games to database
		for (const date of data.dates) {
			for (const game of date.games) {
				await supabase.from('games').upsert({
					id: game.gamePk.toString(),
					game_date: today,
					home_team: game.teams.home.team.name,
					away_team: game.teams.away.team.name,
					status: game.status.detailedState.toLowerCase(),
					inning: game.linescore?.currentInning || 0,
					inning_half: game.linescore?.inningHalf?.toLowerCase() || null,
				});
			}
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error in fetch-games function:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}); 