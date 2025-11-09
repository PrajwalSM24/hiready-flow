import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MessageSquare, CheckCircle2, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const InterviewReport = () => {
  const { interviewId } = useParams<{ interviewId: string }>();

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
  const reportData = {
    role: interview.resumes?.target_role || "Position",
    confidenceScore: analysis.communicationScore || 0,
    contentScore: analysis.technicalScore || 0,
    overallScore: analysis.overallScore || 0,
    strengths: analysis.strengths || [],
    improvements: analysis.improvements || [],
    rejectionReasons: analysis.feedback || [],
  };

  // Chart data
  const performanceData = [
    { category: 'Technical Skills', score: 85 },
    { category: 'Communication', score: 78 },
    { category: 'Problem Solving', score: 80 },
    { category: 'Confidence', score: 75 }
  ];

  const radarData = [
    { skill: 'Technical', A: 85, fullMark: 100 },
    { skill: 'Communication', A: 78, fullMark: 100 },
    { skill: 'Leadership', A: 65, fullMark: 100 },
    { skill: 'Problem Solving', A: 80, fullMark: 100 },
    { skill: 'Adaptability', A: 70, fullMark: 100 },
    { skill: 'Teamwork', A: 75, fullMark: 100 }
  ];

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

        {/* Score Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Overall Performance</CardTitle>
              <CardDescription>Combined assessment score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle
                      cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(reportData.overallScore / 100) * 220} 220`}
                      className="text-success"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.overallScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.overallScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Good performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Confidence Score */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Confidence & Communication</CardTitle>
              <CardDescription>Measures your articulation, clarity, and vocal confidence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(reportData.confidenceScore / 100) * 220} 220`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.confidenceScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.confidenceScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Good confidence level</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Score */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Content & Relevance</CardTitle>
              <CardDescription>Assesses how well your answers align with the role's requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(reportData.contentScore / 100) * 220} 220`}
                      className="text-accent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.contentScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.contentScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Strong content quality</p>
                </div>
              </div>
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
                  <YAxis stroke="hsl(var(--muted-foreground))" />
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
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
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
        <Card className="mb-6 border-l-4 border-l-success border border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <CardTitle className="text-success">Key Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-success/5">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="mb-6 border-l-4 border-l-warning border border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <CardTitle className="text-warning">Areas for Improvement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-warning/5">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Potential Rejection Reasons */}
        <Card className="border-l-4 border-l-destructive border border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Potential Rejection Reasons</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.rejectionReasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

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
