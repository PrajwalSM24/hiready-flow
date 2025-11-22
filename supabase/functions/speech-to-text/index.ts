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
    const { audio } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Transcribing audio with Deepgram...');

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));

    // Send to Deepgram
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: binaryAudio,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', response.status, errorText);
      throw new Error(`Deepgram API error: ${errorText}`);
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    console.log('Transcription completed:', transcript.slice(0, 50));

    return new Response(
      JSON.stringify({ text: transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
