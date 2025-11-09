import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useInterview = () => {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async ({ messages, resumeId, interviewId }: {
      messages: Message[];
      resumeId?: string;
      interviewId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('interview-chat', {
        body: { messages, resumeId, interviewId },
      });

      if (error) {
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error.message?.includes('402')) {
          throw new Error('AI usage limit reached. Please add credits to continue.');
        }
        throw error;
      }
      return data;
    },
    onError: (error: any) => {
      console.error('Interview chat error:', error);
      toast.error(error.message || 'Failed to send message');
    },
  });

  const speechToText = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Speech to text error:', error);
      toast.error(error.message || 'Failed to transcribe audio');
    },
  });

  const textToSpeech = useMutation({
    mutationFn: async ({ text, voice = 'alloy' }: { text: string; voice?: string }) => {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Text to speech error:', error);
      toast.error(error.message || 'Failed to generate speech');
    },
  });

  const generateReport = useMutation({
    mutationFn: async (interviewId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { interviewId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      toast.success('Report generated successfully!');
    },
    onError: (error: any) => {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Failed to generate report');
    },
  });

  const createInterview = useMutation({
    mutationFn: async ({ resumeId }: { resumeId?: string }) => {
      const insertData: any = {
        transcript: [],
        status: 'in_progress',
      };
      
      if (resumeId) {
        insertData.resume_id = resumeId;
      }

      const { data, error } = await supabase
        .from('interviews')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Create interview error:', error);
      toast.error('Failed to create interview');
    },
  });

  const fetchInterviews = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { data, error} = await supabase
        .from('interviews')
        .select('*, resumes(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const fetchInterview = (interviewId: string) => useQuery({
    queryKey: ['interview', interviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select('*, resumes(*)')
        .eq('id', interviewId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!interviewId,
  });

  return {
    sendMessage,
    speechToText,
    textToSpeech,
    generateReport,
    createInterview,
    interviews: fetchInterviews.data,
    isLoadingInterviews: fetchInterviews.isLoading,
    fetchInterview,
  };
};
