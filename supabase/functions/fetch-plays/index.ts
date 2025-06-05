// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PlayEvent {
  details?: {
    description?: string
  }
}

interface MLBPlay {
  about: {
    atBatIndex: number
    inning: number
    halfInning: string
  }
  result: {
    description?: string
  }
  playEvents: PlayEvent[]
}

interface MLBGameData {
  liveData: {
    plays: {
      allPlays: MLBPlay[]
    }
  }
}

serve(async (req: Request) => {
  try {
    const { gameId } = await req.json()

    if (!gameId) {
      throw new Error('Game ID is required')
    }

    const supabase = createClient(
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch live play-by-play from MLB API
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
    )

    if (!response.ok) {
      throw new Error(`MLB API error: ${response.statusText}`)
    }

    const data = await response.json() as MLBGameData
    const plays = data.liveData.plays.allPlays

    // Insert new plays
    for (const play of plays) {
      await supabase.from('plays').upsert({
        game_id: gameId,
        play_id: play.about.atBatIndex.toString(),
        sequence_number: play.about.atBatIndex,
        inning: play.about.inning,
        inning_half: play.about.halfInning.toLowerCase(),
        description: play.result.description || play.playEvents[0]?.details?.description || 'Play occurred'
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    console.error('Error in fetch-plays:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 