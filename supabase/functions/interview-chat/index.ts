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

    console.log('Processing interview chat with Groq, interviewId:', interviewId, 'messageCount:', messages?.length);

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

    // Determine if this is the first question
    const isFirstQuestion = !messages || messages.length === 0;

    let questionText = '';
    let reportUpdate: any = null;

    if (isFirstQuestion) {
      // First question is always introduction
      questionText = "Hello! Thank you for joining this interview. Let's start with an introduction. Please tell me about yourself and your background.";
      console.log('Starting interview with intro question');
    } else {
      // Get the conversation history (last 6 messages for context)
      const conversationHistory = messages.slice(-6);
      
      // Get the last user message for evaluation
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      
      const systemPrompt = `You are an experienced technical interviewer conducting a professional job interview.
${resumeContext}

CRITICAL INSTRUCTIONS:
1. Generate the NEXT interview question based on the candidate's previous answer
2. Evaluate the candidate's last answer and provide scoring
3. Return ONLY valid JSON in this exact format:

{
  "nextQuestion": "Your next interview question here",
  "evaluation": {
    "communicationScore": <1-10>,
    "confidenceScore": <1-10>,
    "technicalScore": <1-10>,
    "grammarScore": <1-10>,
    "notes": "Brief evaluation of the answer (2-3 sentences)"
  }
}

Interview Strategy:
- Ask ONE focused question at a time
- Progress through: introduction → technical skills → problem-solving → behavioral → strengths/weaknesses → role fit
- Increase difficulty gradually based on responses
- Keep questions conversational and professional
- Maximum 8 questions total for the entire interview

The candidate's last answer was: "${lastUserMessage}"

Based on this answer, generate the next appropriate interview question and evaluate their previous response.`;

      // Call Groq API with Llama 3.1 70B
      const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
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
            ...conversationHistory,
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!groqResponse.ok) {
        const error = await groqResponse.text();
        console.error("Groq API error:", error);
        throw new Error(`Groq API error: ${error}`);
      }

      const groqData = await groqResponse.json();
      const responseContent = groqData.choices[0].message.content;
      
      console.log('Groq response received');

      try {
        const parsedResponse = JSON.parse(responseContent);
        questionText = parsedResponse.nextQuestion;
        reportUpdate = parsedResponse.evaluation;
        console.log('Evaluation scores:', reportUpdate);
      } catch (parseError) {
        console.error('Failed to parse Groq response:', parseError);
        // Fallback to basic question
        questionText = "Can you tell me more about your experience with problem-solving in your field?";
      }
    }

    const assistantMessage = questionText;

    // Update interview transcript and report
    if (interviewId) {
      const { data: interviewData } = await supabase
        .from('interviews')
        .select('transcript, analysis_result')
        .eq('id', interviewId)
        .eq('user_id', user.id)
        .single();

      const currentTranscript = interviewData?.transcript || [];
      const updatedTranscript = [
        ...currentTranscript,
        ...messages,
        { role: 'assistant', content: assistantMessage }
      ];

      // Update ongoing analysis report
      const currentAnalysis = interviewData?.analysis_result as any || {
        answers: [],
        communicationScore: 0,
        confidenceScore: 0,
        technicalScore: 0,
        grammarScore: 0,
        evaluationCount: 0,
      };

      if (reportUpdate && !isFirstQuestion) {
        // Add new answer evaluation
        const answerEvaluation = {
          question: messages[messages.length - 2]?.content || '',
          answer: messages[messages.length - 1]?.content || '',
          ...reportUpdate,
          timestamp: new Date().toISOString(),
        };

        const answers = [...(currentAnalysis.answers || []), answerEvaluation];
        const count = answers.length;

        // Calculate running averages
        const avgCommunication = answers.reduce((sum, a) => sum + (a.communicationScore || 0), 0) / count;
        const avgConfidence = answers.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / count;
        const avgTechnical = answers.reduce((sum, a) => sum + (a.technicalScore || 0), 0) / count;
        const avgGrammar = answers.reduce((sum, a) => sum + (a.grammarScore || 0), 0) / count;

        currentAnalysis.answers = answers;
        currentAnalysis.communicationScore = Math.round(avgCommunication);
        currentAnalysis.confidenceScore = Math.round(avgConfidence);
        currentAnalysis.technicalScore = Math.round(avgTechnical);
        currentAnalysis.grammarScore = Math.round(avgGrammar);
        currentAnalysis.evaluationCount = count;
        
        console.log('Updated analysis averages:', {
          communication: currentAnalysis.communicationScore,
          confidence: currentAnalysis.confidenceScore,
          technical: currentAnalysis.technicalScore,
          grammar: currentAnalysis.grammarScore,
        });
      }

      await supabase
        .from('interviews')
        .update({ 
          transcript: updatedTranscript,
          analysis_result: currentAnalysis,
        })
        .eq('id', interviewId)
        .eq('user_id', user.id);
    }

    console.log('Interview chat processed successfully');

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      reportUpdate: reportUpdate,
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
