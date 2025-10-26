import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, FileUp, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

const TeacherDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your students and share knowledge</p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">124</div>
              <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Questions This Week</CardTitle>
              <MessageSquare className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">87</div>
              <p className="text-xs text-muted-foreground mt-1">+12 from last week</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notes Shared</CardTitle>
              <FileText className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">34</div>
              <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, DOCX</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link to="/notes/upload" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-primary text-white">
              <CardHeader>
                <FileUp className="w-12 h-12 mb-4" />
                <CardTitle>Share Notes</CardTitle>
                <CardDescription className="text-white/80">
                  Upload PDF, PPTX, or DOCX files
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/quiz/create" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-secondary text-white">
              <CardHeader>
                <ClipboardCheck className="w-12 h-12 mb-4" />
                <CardTitle>Create Quiz</CardTitle>
                <CardDescription className="text-white/80">
                  Test your students' knowledge
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/questions" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer border-2 border-primary">
              <CardHeader>
                <MessageSquare className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Answer Questions</CardTitle>
                <CardDescription>
                  Help students with their queries
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Student Questions</CardTitle>
            <CardDescription>Help your students by answering their questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "How do I calculate derivatives?", author: "🌸 Gentle Butterfly", time: "5 min ago" },
              { title: "What are the main causes of World War I?", author: "🌟 Starry Fox", time: "12 min ago" },
              { title: "Can you explain Newton's third law?", author: "🦋 Happy Panda", time: "25 min ago" },
            ].map((question, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{question.title}</h3>
                  <p className="text-sm text-muted-foreground">Asked by {question.author} • {question.time}</p>
                </div>
                <Button size="sm">Answer</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
