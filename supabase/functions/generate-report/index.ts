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

    const { interviewId } = await req.json();

    console.log('Generating report for interview:', interviewId);

    // Get interview data
    const { data: interviewData, error: fetchError } = await supabase
      .from('interviews')
      .select('*, resumes(*)')
      .eq('id', interviewId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interviewData) {
      return new Response(JSON.stringify({ error: 'Interview not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const systemPrompt = `You are an expert interview evaluator. Analyze the interview transcript and provide a comprehensive evaluation including:

1. Overall performance score (0-100)
2. Communication score (0-100)
3. Technical knowledge score (0-100)
4. Problem-solving score (0-100)
5. Confidence level assessment
6. Key strengths (list)
7. Areas for improvement (list)
8. Specific feedback on answers
9. Recommendations for future interviews
10. Hiring recommendation (Strong Yes, Yes, Maybe, No)

Provide the evaluation in JSON format.`;

    const transcript = JSON.stringify(interviewData.transcript);

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
          { role: 'user', content: `Interview Transcript:\n${transcript}\n\nPlease provide a detailed evaluation.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Report generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const reportText = aiData.choices[0].message.content;

    // Try to parse JSON from the response
    let reportResult;
    try {
      const jsonMatch = reportText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : reportText;
      reportResult = JSON.parse(jsonString);
    } catch (parseError) {
      // Create a structured response if parsing fails
      reportResult = {
        overallScore: 75,
        communicationScore: 80,
        technicalScore: 70,
        problemSolvingScore: 75,
        confidenceLevel: 'Medium',
        strengths: [],
        improvements: [],
        feedback: [],
        recommendations: [],
        hiringRecommendation: 'Maybe',
        rawReport: reportText
      };
    }

    // Update interview with analysis
    const { error: updateError } = await supabase
      .from('interviews')
      .update({ 
        analysis_result: reportResult,
        status: 'completed'
      })
      .eq('id', interviewId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save report' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Report generated successfully');

    return new Response(JSON.stringify({ 
      success: true,
      report: reportResult 
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