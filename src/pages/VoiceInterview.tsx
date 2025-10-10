import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, X } from "lucide-react";
import { toast } from "sonner";

const VoiceInterview = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [jobRole, setJobRole] = useState("Frontend Developer");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");

  const questions = [
    "Hello! I'm your AI interviewer. Let's start with a simple question - can you tell me about yourself?",
    "That's great! Now, what interests you about this role?",
    "Interesting! Can you describe a challenging project you've worked on?",
    "How did you handle a difficult situation at work?",
    "What are your strengths and weaknesses?",
    "That concludes our interview. Thank you for your time!"
  ];

  useEffect(() => {
    // Simulate AI asking first question
    setTimeout(() => {
      askQuestion(0);
    }, 1500);
  }, []);

  const askQuestion = (index: number) => {
    setIsAISpeaking(true);
    setCaption(questions[index]);
    
    // Simulate speaking duration
    setTimeout(() => {
      setIsAISpeaking(false);
      setCaption("");
    }, 3000);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setCaption("Listening to your response...");
      toast.info("Recording started");
      
      // Simulate recording and processing
      setTimeout(() => {
        setIsRecording(false);
        setCaption("Processing your answer...");
        
        // Move to next question
        setTimeout(() => {
          const nextIndex = questionIndex + 1;
          if (nextIndex < questions.length) {
            setQuestionIndex(nextIndex);
            askQuestion(nextIndex);
          } else {
            // Interview complete
            toast.success("Interview completed!");
            setTimeout(() => {
              navigate("/interview-report");
            }, 1500);
          }
        }, 1500);
      }, 4000);
    } else {
      setIsRecording(false);
      setCaption("");
      toast.info("Recording stopped");
    }
  };

  const handleEndInterview = () => {
    navigate("/interview-report");
  };

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
                <h2 className="text-lg font-semibold text-foreground">{jobRole} Interview</h2>
                <Badge variant="outline" className="text-xs">
                  <div className="w-2 h-2 rounded-full bg-success mr-1.5 animate-pulse" />
                  Technical Interview
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEndInterview}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Leave Interview
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
                        ) : (
                          <Mic className="w-10 h-10 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">AI Interviewer</h3>
                <p className="text-sm text-muted-foreground">HiREady AI Assistant</p>
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
                        <span className="text-4xl font-bold text-primary">P</span>
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
                <h3 className="text-xl font-semibold text-foreground mb-1">Prajwal (You)</h3>
                <p className="text-sm text-muted-foreground">Candidate</p>
              </div>
            </Card>
          </div>

          {/* Job Info Banner */}
          <div className="mb-6 p-4 bg-gradient-hero rounded-lg border border-border text-center">
            <p className="text-sm text-muted-foreground">
              What job <span className="font-semibold text-foreground px-2 py-1 bg-background/50 rounded">{experienceLevel}</span> are you targeting?
            </p>
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
              disabled={isAISpeaking}
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
              >
                End Interview
              </Button>
            </div>
            {!isRecording && !isAISpeaking && (
              <p className="text-sm text-muted-foreground text-center">
                Click the microphone to respond
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 flex justify-center gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-12 rounded-full transition-all ${
                  index <= questionIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VoiceInterview;
