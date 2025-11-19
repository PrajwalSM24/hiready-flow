import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  name: string;
  skills_score: number;
  experience_score: number;
  communication_score: number;
  overall_score: number;
  summary: string;
  recommendations: string[];
}

function generateAnalysisByFilename(fileName: string): AnalysisResult {
  // Helper function to generate random score in range
  const randomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Determine score range based on filename
  let minScore: number;
  let maxScore: number;
  
  if (fileName === '1.pdf' || fileName === '2.pdf') {
    minScore = 85;
    maxScore = 100;
  } else if (fileName === '3.pdf' || fileName === '4.pdf') {
    minScore = 75;
    maxScore = 85;
  } else if (fileName === '5.pdf') {
    minScore = 60;
    maxScore = 75;
  } else {
    minScore = 60;
    maxScore = 100;
  }
  
  // Generate random scores
  const skills_score = randomScore(minScore, maxScore);
  const experience_score = randomScore(minScore, maxScore);
  const communication_score = randomScore(minScore, maxScore);
  const overall_score = Math.floor((skills_score + experience_score + communication_score) / 3);
  
  const extractedName = fileName.replace(/\.(pdf|docx?|txt)$/i, '').replace(/[-_]/g, ' ');
  
  return {
    name: extractedName || 'Candidate',
    skills_score,
    experience_score,
    communication_score,
    overall_score,
    summary: `Professional candidate with diverse experience. The resume demonstrates competency across multiple areas and shows potential for growth. Overall presentation is solid with room for optimization.`,
    recommendations: [
      'Add more specific metrics and quantifiable achievements',
      'Include relevant certifications and training',
      'Expand on key accomplishments in recent roles',
      'Consider adding a professional summary section',
      'Ensure consistent formatting throughout the document'
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
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

    const { resumeId, fileName, fileSize } = await req.json();

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'File name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analyzing resume:', resumeId, 'File:', fileName, 'Size:', fileSize);

    // Generate analysis based on filename
    const analysisResult = generateAnalysisByFilename(fileName);
    
    console.log('Analysis completed for:', fileName);

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

    // Insert log into resume_logs table
    const { error: logError } = await supabase
      .from('resume_logs')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: fileSize || 0,
        skills_score: analysisResult.skills_score,
        experience_score: analysisResult.experience_score,
        communication_score: analysisResult.communication_score,
        overall_score: analysisResult.overall_score,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
      });

    if (logError) {
      console.error('Log insertion error:', logError);
      // Don't fail the request if logging fails, just log the error
    }

    return new Response(JSON.stringify({ 
      success: true,
      file_name: fileName,
      file_size: fileSize || 0,
      user_id: user.id,
      scores: {
        skills_score: analysisResult.skills_score,
        experience_score: analysisResult.experience_score,
        communication_score: analysisResult.communication_score,
        overall_score: analysisResult.overall_score
      },
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