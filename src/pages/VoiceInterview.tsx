import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Fixed interview questions
const INTERVIEW_QUESTIONS = [
  "Hello, welcome to Hiready. Introduce yourself.",
  "What are your strengths?",
  "Explain a recent project you worked on.",
  "Why should we hire you?",
  "What are your weaknesses?",
  "Describe a challenging situation you handled.",
  "Where do you see yourself in the next five years?",
  "Tell me about a time you solved a difficult problem.",
];

const MAX_QUESTIONS = INTERVIEW_QUESTIONS.length;

const VoiceInterview = () => {
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [liveCaption, setLiveCaption] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEndButton, setShowEndButton] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Play pre-recorded question audio
  const playQuestionAudio = useCallback((index: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`/audio/${index + 1}.mp3`);
      audioRef.current = audio;
      
      setIsAISpeaking(true);
      
      audio.onended = () => {
        setIsAISpeaking(false);
        resolve();
      };
      
      audio.onerror = () => {
        setIsAISpeaking(false);
        // If audio file doesn't exist, just resolve after a short delay
        console.warn(`Audio file /audio/${index + 1}.mp3 not found, continuing without audio`);
        setTimeout(resolve, 500);
      };
      
      audio.play().catch(() => {
        setIsAISpeaking(false);
        console.warn(`Failed to play audio file /audio/${index + 1}.mp3`);
        setTimeout(resolve, 500);
      });
    });
  }, []);

  // Initialize SpeechRecognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser");
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    return recognition;
  }, []);

  // Ask the current question
  const askQuestion = useCallback(async (index: number) => {
    if (index >= MAX_QUESTIONS) {
      setShowEndButton(true);
      return;
    }
    
    setIsProcessing(true);
    setLiveCaption("");
    
    // Play audio first
    await playQuestionAudio(index);
    
    // Then show the question
    setLiveCaption(INTERVIEW_QUESTIONS[index]);
    setIsProcessing(false);
  }, [playQuestionAudio]);

  // Move to next question
  const askNextQuestion = useCallback(() => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= MAX_QUESTIONS) {
      setShowEndButton(true);
      setLiveCaption("Interview complete! Click 'End Interview' to see your report.");
    } else {
      setCurrentQuestionIndex(nextIndex);
      askQuestion(nextIndex);
    }
  }, [currentQuestionIndex, askQuestion]);

  // Start recording with SpeechRecognition
  const startRecording = useCallback(() => {
    const recognition = initSpeechRecognition();
    if (!recognition) return;
    
    recognitionRef.current = recognition;
    let finalTranscript = "";
    
    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update live caption with current speech
      setLiveCaption(finalTranscript + interimTranscript || "Listening...");
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };
    
    recognition.onend = () => {
      // Recognition ended, save answer if we have one
      if (finalTranscript.trim() && isRecording) {
        setUserAnswers(prev => {
          const newAnswers = [...prev];
          newAnswers[currentQuestionIndex] = finalTranscript.trim();
          return newAnswers;
        });
      }
    };
    
    recognition.start();
    setIsRecording(true);
    toast.info("Recording started - speak now");
  }, [initSpeechRecognition, currentQuestionIndex, isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    // Save the current caption as the answer
    const currentAnswer = liveCaption.trim();
    if (currentAnswer && currentAnswer !== "Listening..." && !INTERVIEW_QUESTIONS.includes(currentAnswer)) {
      setUserAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = currentAnswer;
        return newAnswers;
      });
      
      // Move to next question after a brief delay
      setTimeout(() => {
        askNextQuestion();
      }, 500);
    } else {
      toast.error("Couldn't hear you clearly. Please try again.");
    }
  }, [liveCaption, currentQuestionIndex, askNextQuestion]);

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // End interview and navigate to report
  const handleEndInterview = useCallback(() => {
    // Stop any ongoing recording
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Navigate to report with collected answers
    navigate("/interview-report", { 
      state: { 
        userAnswers,
        questions: INTERVIEW_QUESTIONS 
      } 
    });
  }, [navigate, userAnswers]);

  // Initialize interview on mount
  useEffect(() => {
    const startInterview = async () => {
      setIsInitializing(true);
      await askQuestion(0);
      setIsInitializing(false);
    };
    
    startInterview();
    
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const progress = ((currentQuestionIndex + 1) / MAX_QUESTIONS) * 100;
  const questionNumber = Math.min(currentQuestionIndex + 1, MAX_QUESTIONS);

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
                  Question {questionNumber} of {MAX_QUESTIONS}
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
              {userAnswers.length > 0 ? 'End Interview' : 'Leave'}
            </Button>
          </div>
        </div>

        {/* Main Interview Area */}
        <div className="max-w-5xl mx-auto px-6 py-8">
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
          {liveCaption && (
            <Card className="mb-6 p-6 border-2 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                <p className="text-base text-foreground flex-1">{liveCaption}</p>
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
                {showEndButton || userAnswers.length > 0 ? 'End & Get Report' : 'Cancel Interview'}
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
              <span>{questionNumber}/{MAX_QUESTIONS} questions</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VoiceInterview;
