import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MessageSquare, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

const InterviewReport = () => {
  // Mock data for the report
  const reportData = {
    role: "Front-end Developer",
    confidenceScore: 10,
    contentScore: 5,
    overallScore: 7.5,
    strengths: [
      "The candidate understands the structure of interview questions.",
      "The candidate is attempting to provide answers to technical questions.",
      "The candidate shows some familiarity with the concepts of front-end development.",
    ],
    improvements: [
      "The responses are nonsensical or incomplete, demonstrating a lack of preparedness.",
      "There is a total lack of clarity and detail in answers.",
      "The candidate does not appropriately engage with the questions asked.",
    ],
    rejectionReasons: [
      "Inability to articulate thoughts clearly and meaningfully.",
      "Lack of relevant technical knowledge and experience.",
      "Failure to demonstrate critical thinking or problem-solving skills in responses.",
    ],
  };

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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                      className="text-warning"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.confidenceScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.confidenceScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Needs significant improvement</p>
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
                      className="text-destructive"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{reportData.contentScore}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Progress value={reportData.contentScore} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">Needs significant improvement</p>
                </div>
              </div>
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
