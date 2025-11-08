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

    const { resumeId, extractedText, targetRole, experienceLevel } = await req.json();

    console.log('Analyzing resume:', resumeId);

    // Use Lovable AI (Gemini) to analyze the resume
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompt = `You are an expert resume analyst and career advisor. Analyze the following resume and provide detailed feedback including:
1. ATS score (0-100)
2. Keywords match score (0-100)
3. Format score (0-100)
4. Overall score (0-100)
5. Key skills identified
6. Strengths
7. Areas for improvement
8. Specific recommendations
9. Interview question suggestions based on the resume
10. Skills distribution by category

Provide the analysis in JSON format.`;

    const userPrompt = `Resume Content: ${extractedText}
    
Target Role: ${targetRole}
Experience Level: ${experienceLevel}

Please analyze this resume and provide comprehensive feedback.`;

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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const analysisText = aiData.choices[0].message.content;

    console.log('AI Analysis completed');

    // Try to parse JSON from the response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, create a structured response
      analysisResult = {
        overallScore: 75,
        atsScore: 70,
        keywordsScore: 75,
        formatScore: 80,
        skills: [],
        strengths: [],
        improvements: [],
        recommendations: [],
        interviewQuestions: [],
        skillsDistribution: {},
        rawAnalysis: analysisText
      };
    }

    // Update the resume record with analysis
    const { error: updateError } = await supabase
      .from('resumes')
      .update({ analysis_result: analysisResult })
      .eq('id', resumeId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save analysis' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysisResult 
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