import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('No text provided');
    }

    console.log('Generating speech with ElevenLabs for text length:', text.length);

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }
    
    // ElevenLabs voice IDs
    // Adam: pNInz6obpgDQGcFmaJgB
    // Default/Alloy equivalent: onwK4e9ZLuTAKqWW03F9 (Daniel)
    const voiceId = voice === 'adam' ? 'pNInz6obpgDQGcFmaJgB' : 'pNInz6obpgDQGcFmaJgB'; // Use Adam by default

    // Use ElevenLabs TTS
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      throw new Error('Failed to generate speech');
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log('Speech generated successfully with ElevenLabs');

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
