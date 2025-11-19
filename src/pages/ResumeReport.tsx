import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ResumeReport = () => {
  const { resumeId } = useParams<{ resumeId: string }>();

  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!resumeId,
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

  if (!resume || !resume.analysis_result) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <Card className="border border-border shadow-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No analysis found for this resume</p>
              <div className="flex justify-center mt-4">
                <Link to="/resume-analysis">
                  <Button>Analyze a Resume</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const analysis = resume.analysis_result as any;
  const reportData = {
    fileName: resume.file_name,
    targetRole: resume.target_role,
    skillsScore: analysis.skills_score || 0,
    experienceScore: analysis.experience_score || 0,
    communicationScore: analysis.communication_score || 0,
    overallScore: analysis.overall_score || 0,
    strengths: analysis.strengths || [],
    improvements: analysis.improvements || [],
    criticalIssues: analysis.recommendations || [],
  };

  // Chart data with actual resume data
  const scoreData = [
    { name: 'Skills', score: reportData.skillsScore },
    { name: 'Experience', score: reportData.experienceScore },
    { name: 'Communication', score: reportData.communicationScore }
  ];

  const skillsDistribution = analysis.skillsDistribution || {
    technical: 45,
    soft: 25,
    tools: 20,
    languages: 10
  };

  const skillsData = Object.entries(skillsDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

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
              <h1 className="text-3xl font-bold text-foreground">Resume Analysis Report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                For <span className="text-primary font-medium">{reportData.targetRole}</span> position
              </p>
            </div>
          </div>
          <Link to="/resume-analysis">
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
              <FileText className="mr-2 w-4 h-4" />
              Upload New Resume
            </Button>
          </Link>
        </div>

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* ATS Score */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">ATS Compatibility</CardTitle>
              <CardDescription>How well your resume passes ATS systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle
                      cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(reportData.skillsScore / 100) * 220} 220`}
                      className="text-success"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.skillsScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.skillsScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Excellent compatibility</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Match */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Keyword Match</CardTitle>
              <CardDescription>Relevance to target role requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle
                      cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(reportData.experienceScore / 100) * 220} 220`}
                      className="text-warning"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.experienceScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.experienceScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Good match</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Score */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Format Quality</CardTitle>
              <CardDescription>Structure and readability assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                    <circle
                      cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(reportData.communicationScore / 100) * 220} 220`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.communicationScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.communicationScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Excellent format</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Visualizations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Score Breakdown */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Score Breakdown</CardTitle>
              <CardDescription>Detailed analysis of resume components</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
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

          {/* Pie Chart - Skills Distribution */}
          <Card className="border border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Skills Distribution</CardTitle>
              <CardDescription>Breakdown of skill categories in your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={skillsDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                   dataKey="value"
                 >
                   {skillsData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
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

        {/* Critical Issues */}
        <Card className="border-l-4 border-l-destructive border border-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Critical Issues to Fix</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {reportData.criticalIssues.map((issue, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="p-6 bg-gradient-hero rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recommended Next Steps</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/resume-analysis" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Update & Re-analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Make improvements and upload your updated resume
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/interview" className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Practice Interview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Prepare for interviews with our AI interviewer
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-sm">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Success Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Learn best practices for resume optimization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeReport;
