import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileUp, MessageSquare, ArrowRight, FileText, Mic } from "lucide-react";

const Dashboard = () => {
  const progress: number = 0; // Can be updated based on user progress

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Prajwal</h1>
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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
              <div className="text-3xl font-bold text-foreground">{progress >= 25 ? "90%" : "0%"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress >= 25 ? "Excellent compatibility" : "Upload resume to see score"}
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
              <div className="text-3xl font-bold text-foreground">{progress >= 75 ? "85%" : "0%"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress >= 75 ? "Great performance!" : "Complete interview to see score"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
