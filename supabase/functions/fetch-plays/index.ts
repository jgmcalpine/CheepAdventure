import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
	gameId: string;
}

serve(async (req: Request) => {
	try {
		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
		);

		const { gameId } = (await req.json()) as RequestBody;

		// Fetch live play-by-play from MLB API
		const response = await fetch(
			`https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch MLB play data');
		}

		const data = await response.json();
		const plays = data.liveData.plays.allPlays;

		// Insert new plays
		for (const play of plays) {
			await supabase.from('plays').upsert({
				game_id: gameId,
				play_id: play.about.atBatIndex.toString(),
				sequence_number: play.about.atBatIndex,
				inning: play.about.inning,
				inning_half: play.about.halfInning.toLowerCase(),
				description:
					play.result.description ||
					play.playEvents[0]?.details?.description ||
					'Play occurred',
			});
		}

		// Update game status
		await supabase
			.from('games')
			.update({
				inning: data.liveData.linescore.currentInning,
				inning_half: data.liveData.linescore.inningHalf.toLowerCase(),
				status: data.gameData.status.detailedState.toLowerCase(),
			})
			.eq('id', gameId);

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error in fetch-plays function:', error);
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