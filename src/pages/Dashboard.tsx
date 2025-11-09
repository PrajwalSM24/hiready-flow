import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileUp, MessageSquare, ArrowRight, FileText, Mic, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useResume } from "@/hooks/useResume";
import { useInterview } from "@/hooks/useInterview";

const Dashboard = () => {
  const { user } = useAuth();
  const { resumes } = useResume();
  const { interviews } = useInterview();
  const [progress, setProgress] = useState<number>(0);

  const latestResume = resumes?.[0];
  const latestInterview = interviews?.[0];
  const hasCompletedInterview = latestInterview?.status === 'completed';

  useEffect(() => {
    let calculatedProgress = 0;
    if (resumes && resumes.length > 0) calculatedProgress += 25;
    if (latestResume?.analysis_result) calculatedProgress += 25;
    if (interviews && interviews.length > 0) calculatedProgress += 25;
    if (hasCompletedInterview) calculatedProgress += 25;
    setProgress(calculatedProgress);
  }, [resumes, latestResume, interviews, hasCompletedInterview]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'there'}
          </h1>
          <p className="text-muted-foreground">Ready to ace your next interview?</p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-primary-foreground mb-2">Your Progress</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Complete your interview preparation journey
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary-foreground">{progress}%</div>
                <p className="text-sm text-primary-foreground/80">Complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2 bg-primary-foreground/20" />
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-primary-foreground/80 mb-1">Resume Upload</p>
                <p className="text-xs text-primary-foreground/60">{progress >= 25 ? "✓" : "○"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-primary-foreground/80 mb-1">Analysis</p>
                <p className="text-xs text-primary-foreground/60">{progress >= 50 ? "✓" : "○"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-primary-foreground/80 mb-1">Interview</p>
                <p className="text-xs text-primary-foreground/60">{progress >= 75 ? "✓" : "○"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-primary-foreground/80 mb-1">Complete</p>
                <p className="text-xs text-primary-foreground/60">{progress === 100 ? "✓" : "○"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Resume Upload Card */}
          <Card className="border border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <FileUp className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>
                Get started with AI-powered resume analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/resume-analysis">
                <Button className="bg-gradient-accent hover:opacity-90 transition-opacity">
                  Upload Resume <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Interview Card */}
          <Card className="border border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Start Mock Interview</CardTitle>
              <CardDescription>
                Practice with our autonomous AI interviewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/interview">
                <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                  Start Interview <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* View Report Card */}
          <Card className="border border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <CardTitle>View Reports</CardTitle>
              <CardDescription>
                Review your interview performance and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={latestInterview && hasCompletedInterview ? `/interview-report/${latestInterview.id}` : "/interview-report"}>
                <Button 
                  className="bg-gradient-accent hover:opacity-90 transition-opacity"
                  disabled={!hasCompletedInterview}
                >
                  View Report <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              {!hasCompletedInterview && (
                <p className="text-xs text-muted-foreground mt-2">
                  Complete an interview to unlock reports
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ATS Score Card */}
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-metric/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-metric" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(latestResume?.analysis_result as any)?.atsScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {latestResume?.analysis_result ? "Excellent compatibility" : "Upload resume to see score"}
              </p>
            </CardContent>
          </Card>

          {/* Interview Score Card */}
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interview Score</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Mic className="w-5 h-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(latestInterview?.analysis_result as any)?.overallScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {hasCompletedInterview ? "Great performance!" : "Complete interview to see score"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
