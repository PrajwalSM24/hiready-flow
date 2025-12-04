import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInterview } from "@/hooks/useInterview";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ScoreData {
  communicationScore: number;
  confidenceScore: number;
  technicalScore: number;
  grammarScore: number;
}

const VoiceInterview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId') || undefined;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [caption, setCaption] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [scores, setScores] = useState<ScoreData>({
    communicationScore: 0,
    confidenceScore: 0,
    technicalScore: 0,
    grammarScore: 0,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { 
    createInterview, 
    sendMessage, 
    speechToText, 
    textToSpeech,
    generateReport 
  } = useInterview();

  const MAX_QUESTIONS = 8;

  // Play audio from base64
  const playAudio = useCallback(async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsAISpeaking(false);
          resolve();
        };
        
        audio.onerror = (e) => {
          setIsAISpeaking(false);
          reject(e);
        };
        
        setIsAISpeaking(true);
        audio.play();
      } catch (error) {
        setIsAISpeaking(false);
        reject(error);
      }
    });
  }, []);

  // Start interview and ask first question
  const initializeInterview = useCallback(async () => {
    try {
      setIsInitializing(true);
      
      // Create interview session
      const interview = await createInterview.mutateAsync({ resumeId });
      if (!interview) throw new Error('Failed to create interview');
      
      setInterviewId(interview.id);
      
      // Get first question from AI
      const response = await sendMessage.mutateAsync({
        messages: [],
        resumeId,
        interviewId: interview.id,
      });
      
      const firstQuestion = response.nextQuestion || "Introduce yourself and tell me about your background.";
      setCaption(firstQuestion);
      setMessages([{ role: 'assistant', content: firstQuestion }]);
      setQuestionCount(1);
      
      // Convert to speech
      const ttsResponse = await textToSpeech.mutateAsync({ text: firstQuestion });
      if (ttsResponse?.audioContent) {
        await playAudio(ttsResponse.audioContent);
      }
      
      setIsInitializing(false);
    } catch (error) {
      console.error('Failed to initialize interview:', error);
      toast.error('Failed to start interview. Please try again.');
      setIsInitializing(false);
    }
  }, [createInterview, sendMessage, textToSpeech, resumeId, playAudio]);

  useEffect(() => {
    initializeInterview();
    
    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processRecording(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started - speak now");
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process recorded audio
  const processRecording = async (audioBlob: Blob) => {
    if (!interviewId) return;
    
    setIsProcessing(true);
    setCaption("Processing your response...");
    
    try {
      // Convert speech to text
      const sttResponse = await speechToText.mutateAsync(audioBlob);
      const transcript = sttResponse?.transcript || '';
      
      if (!transcript.trim()) {
        toast.error("Couldn't hear you clearly. Please try again.");
        setCaption("");
        setIsProcessing(false);
        return;
      }
      
      setCaption(`You said: "${transcript}"`);
      
      // Add user message to history
      const updatedMessages: Message[] = [...messages, { role: 'user', content: transcript }];
      setMessages(updatedMessages);
      
      // Check if we've reached max questions
      if (questionCount >= MAX_QUESTIONS) {
        await finishInterview();
        return;
      }
      
      // Get next question from AI
      const chatResponse = await sendMessage.mutateAsync({
        messages: updatedMessages,
        resumeId,
        interviewId,
      });
      
      const nextQuestion = chatResponse?.nextQuestion || '';
      const reportUpdate = chatResponse?.reportUpdate;
      
      // Update scores if available
      if (reportUpdate) {
        setScores({
          communicationScore: reportUpdate.communicationScore || scores.communicationScore,
          confidenceScore: reportUpdate.confidenceScore || scores.confidenceScore,
          technicalScore: reportUpdate.technicalScore || scores.technicalScore,
          grammarScore: reportUpdate.grammarScore || scores.grammarScore,
        });
      }
      
      // Add assistant message
      setMessages([...updatedMessages, { role: 'assistant', content: nextQuestion }]);
      setCaption(nextQuestion);
      setQuestionCount(prev => prev + 1);
      
      // Convert to speech
      const ttsResponse = await textToSpeech.mutateAsync({ text: nextQuestion });
      if (ttsResponse?.audioContent) {
        await playAudio(ttsResponse.audioContent);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process your response');
      setCaption("");
      setIsProcessing(false);
    }
  };

  // Finish interview and generate report
  const finishInterview = async () => {
    if (!interviewId) return;
    
    setIsProcessing(true);
    setCaption("Generating your interview report...");
    
    try {
      await generateReport.mutateAsync(interviewId);
      toast.success("Interview completed!");
      navigate(`/interview-report?id=${interviewId}`);
    } catch (error) {
      console.error('Error finishing interview:', error);
      toast.error('Failed to generate report');
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleEndInterview = async () => {
    if (interviewId && questionCount > 1) {
      await finishInterview();
    } else {
      navigate("/dashboard");
    }
  };

  const progress = (questionCount / MAX_QUESTIONS) * 100;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Interview Session</h2>
                <Badge variant="outline" className="text-xs">
                  <div className="w-2 h-2 rounded-full bg-success mr-1.5 animate-pulse" />
                  Question {questionCount} of {MAX_QUESTIONS}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndInterview}
              className="text-destructive hover:text-destructive"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-1" />
              {questionCount > 1 ? 'End Interview' : 'Leave'}
            </Button>
          </div>
        </div>

        {/* Main Interview Area */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Score Dashboard */}
          {questionCount > 1 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Communication</p>
                <p className="text-2xl font-bold text-primary">{scores.communicationScore}/10</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                <p className="text-2xl font-bold text-primary">{scores.confidenceScore}/10</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Technical</p>
                <p className="text-2xl font-bold text-primary">{scores.technicalScore}/10</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Grammar</p>
                <p className="text-2xl font-bold text-primary">{scores.grammarScore}/10</p>
              </Card>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* AI Interviewer Card */}
            <Card className="relative overflow-hidden border-2 border-border bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
              <div className="relative p-8 flex flex-col items-center justify-center min-h-[320px]">
                <div className={`relative mb-6 ${isAISpeaking ? 'animate-pulse' : ''}`}>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {isAISpeaking ? (
                          <div className="flex gap-1">
                            <div className="w-1 h-8 bg-primary rounded-full animate-pulse" />
                            <div className="w-1 h-12 bg-primary rounded-full animate-pulse delay-75" />
                            <div className="w-1 h-8 bg-primary rounded-full animate-pulse delay-150" />
                          </div>
                        ) : isInitializing || isProcessing ? (
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        ) : (
                          <Mic className="w-10 h-10 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">AI Interviewer</h3>
                <p className="text-sm text-muted-foreground">
                  {isAISpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Listening'}
                </p>
              </div>
            </Card>

            {/* User Card */}
            <Card className="relative overflow-hidden border-2 border-border bg-card/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5" />
              <div className="relative p-8 flex flex-col items-center justify-center min-h-[320px]">
                <div className={`relative mb-6 ${isRecording ? 'ring-4 ring-destructive/30 rounded-full' : ''}`}>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary">You</span>
                      </div>
                    </div>
                  </div>
                  {isRecording && (
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="destructive" className="animate-pulse">
                        Recording
                      </Badge>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">Candidate</h3>
                <p className="text-sm text-muted-foreground">
                  {isRecording ? 'Speaking...' : 'Ready to respond'}
                </p>
              </div>
            </Card>
          </div>

          {/* Caption Box */}
          {caption && (
            <Card className="mb-6 p-6 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                <p className="text-base text-foreground flex-1">{caption}</p>
              </div>
            </Card>
          )}

          {/* Controls */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              onClick={toggleRecording}
              disabled={isAISpeaking || isProcessing || isInitializing}
              className={`w-20 h-20 rounded-full transition-all ${
                isRecording
                  ? "bg-destructive hover:bg-destructive/90 scale-110"
                  : "bg-gradient-primary hover:opacity-90"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndInterview}
                className="text-destructive hover:text-destructive"
                disabled={isProcessing}
              >
                {questionCount > 1 ? 'End & Get Report' : 'Cancel Interview'}
              </Button>
            </div>
            {!isRecording && !isAISpeaking && !isProcessing && !isInitializing && (
              <p className="text-sm text-muted-foreground text-center">
                Click the microphone to respond
              </p>
            )}
            {isInitializing && (
              <p className="text-sm text-muted-foreground text-center">
                Starting interview...
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{questionCount}/{MAX_QUESTIONS} questions</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VoiceInterview;
