import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CronRequest {
  type: 'fetch-games' | 'fetch-plays' | 'generate-audio';
}

serve(async (req) => {
  try {
    const { type } = await req.json() as CronRequest;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (type) {
      case 'fetch-games': {
        // Fetch today's games
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=game(content(editorial(recap))),decisions,linescore`
        );

        if (!response.ok) {
          throw new Error(`MLB API error: ${response.statusText}`);
        }

        const data = await response.json();
        for (const date of data.dates) {
          for (const game of date.games) {
            await supabase.from('games').upsert({
              id: game.gamePk.toString(),
              game_date: today,
              home_team: game.teams.home.team.name,
              away_team: game.teams.away.team.name,
              status: game.status.detailedState.toLowerCase(),
              inning: game.linescore?.currentInning,
              inning_half: game.linescore?.inningHalf?.toLowerCase(),
              updated_at: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'fetch-plays': {
        // Get all live games
        const { data: liveGames } = await supabase
          .from('games')
          .select('id')
          .eq('status', 'live');

        if (!liveGames) break;

        // Fetch plays for each live game
        for (const game of liveGames) {
          const response = await fetch(
            `https://statsapi.mlb.com/api/v1.1/game/${game.id}/feed/live`
          );

          if (!response.ok) {
            console.error(`Error fetching plays for game ${game.id}: ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          const plays = data.liveData.plays.allPlays;

          for (const play of plays) {
            const { error } = await supabase.from('plays').upsert({
              game_id: game.id,
              play_id: play.about.atBatIndex.toString(),
              sequence_number: play.about.atBatIndex,
              inning: play.about.inning,
              inning_half: play.about.halfInning.toLowerCase(),
              description: play.result.description || play.playEvents[0]?.details?.description || 'Play occurred',
            });

            if (error) {
              console.error(`Error upserting play for game ${game.id}:`, error);
            }
          }
        }
        break;
      }

      case 'generate-audio': {
        // Get plays without audio
        const { data: pendingPlays } = await supabase
          .from('plays')
          .select('id, description')
          .is('audio_url', null)
          .order('sequence_number', { ascending: true })
          .limit(10); // Process in batches

        if (!pendingPlays) break;

        const VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID')!;
        const API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;

        for (const play of pendingPlays) {
          try {
            // Generate speech
            const response = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
              {
                method: 'POST',
                headers: {
                  'Accept': 'audio/mpeg',
                  'Content-Type': 'application/json',
                  'xi-api-key': API_KEY,
                },
                body: JSON.stringify({
                  text: play.description,
                  model_id: 'eleven_monolingual_v1',
                  voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                  },
                }),
              }
            );

            if (!response.ok) {
              console.error(`Error generating audio for play ${play.id}: ${response.statusText}`);
              continue;
            }

            const audioBuffer = await response.arrayBuffer();
            const fileName = `plays/${play.id}.mp3`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('audio-files')
              .upload(fileName, audioBuffer, {
                contentType: 'audio/mpeg',
                upsert: true,
              });

            if (uploadError) {
              console.error(`Error uploading audio for play ${play.id}:`, uploadError);
              continue;
            }

            // Get public URL and update play
            const { data: urlData } = await supabase.storage
              .from('audio-files')
              .getPublicUrl(fileName);

            await supabase
              .from('plays')
              .update({
                audio_url: urlData.publicUrl,
                audio_generated_at: new Date().toISOString(),
              })
              .eq('id', play.id);
          } catch (error) {
            console.error(`Error processing audio for play ${play.id}:`, error);
          }
        }
        break;
      }

      default:
        throw new Error(`Unknown cron job type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} job completed successfully` }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in cron handler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}); 