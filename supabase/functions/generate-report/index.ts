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

    console.log('Generating final report for interview:', interviewId);

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

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    // Get the running analysis from the interview
    const currentAnalysis = interviewData.analysis_result as any || {};
    const transcript = interviewData.transcript || [];
    
    const systemPrompt = `You are an expert interview evaluator. You have been evaluating an interview in real-time, and now need to provide a comprehensive FINAL report.

Running Analysis Data:
- Communication Score (Average): ${currentAnalysis.communicationScore || 0}/10
- Confidence Score (Average): ${currentAnalysis.confidenceScore || 0}/10
- Technical Score (Average): ${currentAnalysis.technicalScore || 0}/10
- Grammar Score (Average): ${currentAnalysis.grammarScore || 0}/10
- Number of Q&A exchanges: ${currentAnalysis.evaluationCount || 0}

Individual Answer Evaluations:
${JSON.stringify(currentAnalysis.answers || [], null, 2)}

Interview Transcript:
${JSON.stringify(transcript, null, 2)}

CRITICAL: Generate a comprehensive final report in STRICT JSON format:

{
  "overallSummary": "2-3 sentences about the candidate's overall performance",
  "communicationScore": <1-10>,
  "confidenceScore": <1-10>,
  "technicalScore": <1-10>,
  "grammarScore": <1-10>,
  "overallScore": <calculated average 1-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "improvements": ["improvement tip 1", "improvement tip 2", "improvement tip 3"],
  "recommendation": "Hire" or "No Hire",
  "detailedFeedback": "3-4 sentences with specific examples from the interview"
}

Use the running analysis scores and individual evaluations to make your final assessment. Be specific and reference actual answers from the interview.`;

    // Call Groq API with Llama 3.1 70B
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the final comprehensive interview report based on the data provided." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.text();
      console.error("Groq API error:", error);
      throw new Error(`Groq API error: ${error}`);
    }

    const groqData = await groqResponse.json();
    const reportText = groqData.choices[0].message.content;
    
    console.log('Groq report generated');

    // Parse the JSON response
    let reportResult;
    try {
      reportResult = JSON.parse(reportText);
      
      // Ensure all required fields exist with defaults
      reportResult = {
        overallSummary: reportResult.overallSummary || "Interview completed successfully.",
        communicationScore: reportResult.communicationScore || currentAnalysis.communicationScore || 5,
        confidenceScore: reportResult.confidenceScore || currentAnalysis.confidenceScore || 5,
        technicalScore: reportResult.technicalScore || currentAnalysis.technicalScore || 5,
        grammarScore: reportResult.grammarScore || currentAnalysis.grammarScore || 5,
        overallScore: reportResult.overallScore || Math.round((
          (reportResult.communicationScore || 5) +
          (reportResult.confidenceScore || 5) +
          (reportResult.technicalScore || 5) +
          (reportResult.grammarScore || 5)
        ) / 4),
        strengths: reportResult.strengths || ["Good communication", "Professional demeanor", "Relevant experience"],
        weaknesses: reportResult.weaknesses || ["Could provide more detail", "Room for technical depth"],
        improvements: reportResult.improvements || ["Practice answering behavioral questions", "Expand on technical examples"],
        recommendation: reportResult.recommendation || "Hire",
        detailedFeedback: reportResult.detailedFeedback || "The candidate demonstrated competency across key areas.",
        answers: currentAnalysis.answers || [],
        evaluationCount: currentAnalysis.evaluationCount || 0,
      };
    } catch (parseError) {
      console.error('Failed to parse Groq report:', parseError);
      // Create a structured fallback using the running analysis
      reportResult = {
        overallSummary: "Interview completed. Analysis based on real-time evaluations.",
        communicationScore: currentAnalysis.communicationScore || 5,
        confidenceScore: currentAnalysis.confidenceScore || 5,
        technicalScore: currentAnalysis.technicalScore || 5,
        grammarScore: currentAnalysis.grammarScore || 5,
        overallScore: Math.round((
          (currentAnalysis.communicationScore || 5) +
          (currentAnalysis.confidenceScore || 5) +
          (currentAnalysis.technicalScore || 5) +
          (currentAnalysis.grammarScore || 5)
        ) / 4),
        strengths: ["Completed interview", "Engaged in conversation", "Professional approach"],
        weaknesses: ["More detailed responses recommended"],
        improvements: ["Practice technical questions", "Provide specific examples"],
        recommendation: "Hire",
        detailedFeedback: "The candidate participated in the interview and demonstrated competency.",
        answers: currentAnalysis.answers || [],
        evaluationCount: currentAnalysis.evaluationCount || 0,
      };
    }

    // Update interview with final analysis
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

    console.log('Final report generated and saved successfully');

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
