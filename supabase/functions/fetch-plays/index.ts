import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MLBPlay {
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
}

serve(async (req) => {
  try {
    const { gameId } = await req.json();

    if (!gameId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Game ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch live play-by-play from MLB API
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
    );

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.statusText}`);
    }

    const data = await response.json();
    const plays = data.liveData.plays.allPlays as MLBPlay[];

    // Insert new plays
    for (const play of plays) {
      const playData = {
        game_id: gameId,
        play_id: play.about.atBatIndex.toString(),
        sequence_number: play.about.atBatIndex,
        inning: play.about.inning,
        inning_half: play.about.halfInning.toLowerCase(),
        description: play.result.description || play.playEvents[0]?.details?.description || 'Play occurred',
      };

      const { error } = await supabase
        .from('plays')
        .upsert(playData, {
          onConflict: 'game_id,play_id',
        });

      if (error) {
        console.error('Error upserting play:', error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Plays synced successfully' }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-plays function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}); 