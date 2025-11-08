import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, resumeId, interviewId } = await req.json();

    console.log('Processing interview chat, interviewId:', interviewId);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Get resume context if available
    let resumeContext = '';
    if (resumeId) {
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('extracted_text, target_role, experience_level')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single();

      if (resumeData) {
        resumeContext = `
Resume Context:
Target Role: ${resumeData.target_role}
Experience Level: ${resumeData.experience_level}
Resume Content: ${resumeData.extracted_text?.substring(0, 1000)}...
`;
      }
    }

    const systemPrompt = `You are an expert interviewer conducting a professional job interview. 
${resumeContext}

Your role is to:
1. Ask thoughtful, relevant questions based on the candidate's resume and target role
2. Follow up on answers with probing questions
3. Evaluate technical knowledge and soft skills
4. Provide a natural, conversational interview experience
5. Keep questions concise and focused

Conduct the interview professionally but warmly. Ask one question at a time.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI chat failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Update interview transcript
    if (interviewId) {
      const { data: interviewData } = await supabase
        .from('interviews')
        .select('transcript')
        .eq('id', interviewId)
        .eq('user_id', user.id)
        .single();

      const currentTranscript = interviewData?.transcript || [];
      const updatedTranscript = [
        ...currentTranscript,
        ...messages,
        { role: 'assistant', content: assistantMessage }
      ];

      await supabase
        .from('interviews')
        .update({ transcript: updatedTranscript })
        .eq('id', interviewId)
        .eq('user_id', user.id);
    }

    console.log('Interview chat processed successfully');

    return new Response(JSON.stringify({ 
      message: assistantMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});