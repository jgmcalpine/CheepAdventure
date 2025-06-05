// @ts-ignore: Deno imports
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore: Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  playId: string
  text: string
}

serve(async (req: Request) => {
  try {
    const { playId, text } = await req.json() as RequestBody

    if (!playId || !text) {
      throw new Error('Play ID and text are required')
    }

    const supabase = createClient(
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_URL')!,
      // @ts-ignore: Deno env
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Generate speech with ElevenLabs
    // @ts-ignore: Deno env
    const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID')
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        // @ts-ignore: Deno env
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')!
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()

    // Upload to Supabase Storage
    const fileName = `plays/${playId}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Storage upload error: ${uploadError.message}`)
    }

    if (uploadData) {
      const { data: urlData } = await supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName)

      // Update play with audio URL
      const { error: updateError } = await supabase.from('plays')
        .update({
          audio_url: urlData.publicUrl,
          audio_generated_at: new Date().toISOString()
        })
        .eq('id', playId)

      if (updateError) {
        throw new Error(`Play update error: ${updateError.message}`)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    console.error('Error in generate-audio:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}) 