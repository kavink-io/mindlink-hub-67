import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Timer, Sparkles, Award, TrendingUp, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const [streak, setStreak] = useState(5);
  const anonymousName = "🌸 Gentle Butterfly";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {anonymousName}!</h1>
          <p className="text-muted-foreground">Keep learning and growing every day</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-soft hover:shadow-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Award className="w-4 h-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{streak} days</div>
              <p className="text-xs text-muted-foreground mt-1">Keep it up! 🔥</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
              <MessageSquare className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">23</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Answers Provided</CardTitle>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">47</div>
              <p className="text-xs text-muted-foreground mt-1">Helping others!</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-hover transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Award className="w-4 h-4 text-accent animate-pulse-glow" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">3 more to next level!</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link to="/questions" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-primary text-white">
              <CardHeader>
                <BookOpen className="w-12 h-12 mb-4" />
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription className="text-white/80">
                  Get help from your peers and teachers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/timer" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-secondary text-white">
              <CardHeader>
                <Timer className="w-12 h-12 mb-4" />
                <CardTitle>Focus Timer</CardTitle>
                <CardDescription className="text-white/80">
                  Stay productive with study sessions
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/relax" className="block">
            <Card className="h-full shadow-soft hover:shadow-hover transition-all hover:scale-105 cursor-pointer bg-gradient-relax text-white">
              <CardHeader>
                <Sparkles className="w-12 h-12 mb-4" />
                <CardTitle>Relax Room</CardTitle>
                <CardDescription className="text-white/80">
                  Take a break with calming music
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
            <CardDescription>Browse and answer questions from your peers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "How do I solve quadratic equations?", author: "🌟 Starry Fox", answers: 3, likes: 12 },
              { title: "What's the difference between mitosis and meiosis?", author: "🦋 Happy Panda", answers: 5, likes: 8 },
              { title: "Can someone explain photosynthesis?", author: "🌺 Sunny Rabbit", answers: 2, likes: 15 },
            ].map((question, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{question.title}</h3>
                  <p className="text-sm text-muted-foreground">Asked by {question.author}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{question.answers} answers</span>
                  <span>❤️ {question.likes}</span>
                  <Button size="sm" variant="outline">Answer</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
