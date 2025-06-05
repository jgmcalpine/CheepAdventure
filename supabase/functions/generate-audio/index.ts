import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RequestBody {
  playId: string;
  text: string;
}

serve(async (req) => {
  try {
    const { playId, text } = await req.json() as RequestBody;

    if (!playId || !text) {
      return new Response(
        JSON.stringify({ success: false, error: 'Play ID and text are required' }),
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

    const VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID')!;
    const API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;

    // Generate speech with ElevenLabs
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
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `plays/${playId}.mp3`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // Update play with audio URL
    const { error: updateError } = await supabase
      .from('plays')
      .update({
        audio_url: urlData.publicUrl,
        audio_generated_at: new Date().toISOString(),
      })
      .eq('id', playId);

    if (updateError) {
      throw new Error(`Play update error: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Audio generated and stored successfully',
        audioUrl: urlData.publicUrl,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-audio function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}); 