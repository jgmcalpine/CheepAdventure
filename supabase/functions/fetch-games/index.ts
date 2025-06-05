import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MLBGame {
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
  linescore?: {
    currentInning?: number;
    inningHalf?: 'top' | 'bottom';
  };
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch today's games from MLB StatsAPI
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=game(content(editorial(recap))),decisions,linescore`
    );

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Process and sync games
    for (const date of data.dates) {
      for (const game of date.games as MLBGame[]) {
        const gameData = {
          id: game.gamePk.toString(),
          game_date: today,
          home_team: game.teams.home.team.name,
          away_team: game.teams.away.team.name,
          status: game.status.detailedState.toLowerCase(),
          inning: game.linescore?.currentInning,
          inning_half: game.linescore?.inningHalf?.toLowerCase(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('games')
          .upsert(gameData, {
            onConflict: 'id',
          });

        if (error) {
          console.error('Error upserting game:', error);
          continue;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Games synced successfully' }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-games function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}); 