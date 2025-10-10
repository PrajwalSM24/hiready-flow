import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

const Interview = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Autonomous question flow
  const questions = [
    "Hello! I'm your AI interviewer. Let's start with a simple question - can you tell me about yourself?",
    "That's great! Now, what interests you about this role?",
    "Interesting! Can you describe a challenging project you've worked on?",
    "How did you handle a difficult situation at work?",
    "What are your strengths and weaknesses?",
    "That concludes our interview. Thank you for your time!"
  ];

  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    // Start with first question
    if (messages.length === 0) {
      setTimeout(() => {
        addAIMessage(questions[0]);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addAIMessage = (content: string) => {
    setIsAISpeaking(true);
    setMessages(prev => [...prev, { role: "ai", content, timestamp: new Date() }]);
    
    // Simulate AI speaking duration
    setTimeout(() => {
      setIsAISpeaking(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) {
      toast.error("Please enter your response");
      return;
    }

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: currentInput, timestamp: new Date() }]);
    setCurrentInput("");

    // Autonomous flow - automatically ask next question
    setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex < questions.length) {
        addAIMessage(questions[nextIndex]);
        setQuestionIndex(nextIndex);
      } else {
        // Interview complete
        setTimeout(() => {
          toast.success("Interview completed!");
          navigate("/interview-report");
        }, 2000);
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.info("Recording started (simulated)");
    } else {
      toast.info("Recording stopped");
    }
  };

  const handleEndInterview = () => {
    navigate("/interview-report");
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
        {/* Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <div className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
                Interview in Progress
              </Badge>
              <span className="text-sm text-muted-foreground">
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndInterview}
            >
              End Interview
            </Button>
          </div>
        </div>

        {/* Interview Area */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto h-full p-6">
            <div className="grid lg:grid-cols-3 gap-6 h-full">
              {/* Video/Avatar Area */}
              <div className="lg:col-span-1 space-y-4">
                {/* AI Interviewer */}
                <Card className="p-6 border border-border">
                  <div className="flex flex-col items-center">
                    <div className={`relative mb-4 ${isAISpeaking ? 'animate-pulse' : ''}`}>
                      <Avatar className="w-24 h-24">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      {isAISpeaking && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" />
                            <div className="w-1 h-6 bg-primary rounded-full animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-primary rounded-full animate-pulse delay-150" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-foreground">AI Interviewer</p>
                    <p className="text-sm text-muted-foreground">HiREady AI</p>
                  </div>
                </Card>

                {/* User */}
                <Card className="p-6 border border-border">
                  <div className="flex flex-col items-center">
                    <div className={`relative mb-4 ${isRecording ? 'ring-4 ring-destructive/20' : ''}`}>
                      <Avatar className="w-24 h-24">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          P
                        </AvatarFallback>
                      </Avatar>
                      {isRecording && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <Badge variant="destructive" className="text-xs">
                            Recording
                          </Badge>
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-foreground">You</p>
                    <p className="text-sm text-muted-foreground">Candidate</p>
                  </div>
                </Card>

                {/* Controls */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleRecording}
                    className={isRecording ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                </div>
              </div>

              {/* Chat/Transcript Area */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col border border-border">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={message.role === "ai" ? "bg-gradient-primary text-primary-foreground" : "bg-primary text-primary-foreground"}>
                            {message.role === "ai" ? "AI" : "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === "ai"
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.role === "ai" ? "text-muted-foreground" : "text-primary-foreground/80"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                      <textarea
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your response here..."
                        className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!currentInput.trim()}
                        className="bg-gradient-primary hover:opacity-90 transition-opacity"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Interview;
