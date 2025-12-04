import { useParams, useSearchParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, CheckCircle2, AlertTriangle, AlertCircle, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const InterviewReport = () => {
  const { interviewId: paramId } = useParams<{ interviewId: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const interviewId = paramId || queryId;

  const { data: interview, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!interview || !interview.analysis_result) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <Card className="border border-border shadow-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No report found for this interview</p>
              <div className="flex justify-center mt-4">
                <Link to="/interview">
                  <Button>Start an Interview</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const analysis = interview.analysis_result as any;
  
  // Handle both old and new report format
  const communicationScore = analysis.communicationScore || 0;
  const confidenceScore = analysis.confidenceScore || 0;
  const technicalScore = analysis.technicalScore || 0;
  const grammarScore = analysis.grammarScore || 0;
  const overallScore = analysis.overallScore || Math.round((communicationScore + confidenceScore + technicalScore + grammarScore) / 4 * 10);
  
  const reportData = {
    role: interview.resumes?.target_role || "Position",
    overallScore,
    communicationScore: communicationScore * 10,
    confidenceScore: confidenceScore * 10,
    technicalScore: technicalScore * 10,
    grammarScore: grammarScore * 10,
    strengths: analysis.strengths || [],
    weaknesses: analysis.weaknesses || [],
    improvements: analysis.improvements || [],
    overallSummary: analysis.overallSummary || '',
    recommendation: analysis.recommendation || 'Pending',
  };

  // Chart data from actual scores
  const performanceData = [
    { category: 'Communication', score: reportData.communicationScore },
    { category: 'Confidence', score: reportData.confidenceScore },
    { category: 'Technical', score: reportData.technicalScore },
    { category: 'Grammar', score: reportData.grammarScore }
  ];

  const radarData = [
    { skill: 'Communication', A: reportData.communicationScore, fullMark: 100 },
    { skill: 'Confidence', A: reportData.confidenceScore, fullMark: 100 },
    { skill: 'Technical', A: reportData.technicalScore, fullMark: 100 },
    { skill: 'Grammar', A: reportData.grammarScore, fullMark: 100 },
    { skill: 'Overall', A: reportData.overallScore, fullMark: 100 }
  ];

  const isHireRecommendation = reportData.recommendation?.toLowerCase().includes('hire') && 
    !reportData.recommendation?.toLowerCase().includes('no hire');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Interview Feedback Report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                For the role of <span className="text-primary font-medium">{reportData.role}</span>
              </p>
            </div>
          </div>
          <Link to="/interview">
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
              <MessageSquare className="mr-2 w-4 h-4" />
              Start a New Interview
            </Button>
          </Link>
        </div>

        {/* Recommendation Banner */}
        <Card className={`mb-6 border-2 ${isHireRecommendation ? 'border-success bg-success/5' : 'border-warning bg-warning/5'}`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isHireRecommendation ? (
                  <ThumbsUp className="w-10 h-10 text-success" />
                ) : (
                  <ThumbsDown className="w-10 h-10 text-warning" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-foreground">AI Recommendation</h2>
                  <p className="text-muted-foreground">{reportData.recommendation}</p>
                </div>
              </div>
              <Badge 
                variant={isHireRecommendation ? "default" : "secondary"} 
                className={`text-lg px-4 py-2 ${isHireRecommendation ? 'bg-success' : 'bg-warning'}`}
              >
                {reportData.overallScore}% Overall
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {reportData.overallSummary && (
          <Card className="mb-6 border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Interview Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">{reportData.overallSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Score Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{reportData.communicationScore}%</span>
              </div>
              <Progress value={reportData.communicationScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{reportData.confidenceScore}%</span>
              </div>
              <Progress value={reportData.confidenceScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Technical Depth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{reportData.technicalScore}%</span>
              </div>
              <Progress value={reportData.technicalScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="border border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Grammar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">{reportData.grammarScore}%</span>
              </div>
              <Progress value={reportData.grammarScore} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Data Visualizations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Performance Breakdown */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Performance Breakdown</CardTitle>
              <CardDescription>Detailed scoring across key areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart - Skills Assessment */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Skills Assessment</CardTitle>
              <CardDescription>Comprehensive evaluation across competencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Radar name="Your Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                  <Legend />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Strengths */}
        {reportData.strengths.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-success border border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <CardTitle className="text-success">Key Strengths</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-success/5">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Weaknesses */}
        {reportData.weaknesses.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-destructive border border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Areas of Concern</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {reportData.improvements.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-warning border border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <CardTitle className="text-warning">Recommended Improvements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.improvements.map((improvement: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-gradient-hero rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Next Steps</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/resume-analysis" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Optimize Your Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Improve your resume's ATS compatibility and get more interview calls
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/interview" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Practice More</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Take another mock interview to improve your skills
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm">Review Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Access our library of interview tips and best practices
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewReport;
