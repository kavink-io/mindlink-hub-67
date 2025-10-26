import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Timer, Sparkles, Award } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="text-white space-y-6 animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Learn, Connect, <span className="text-secondary">Grow Together</span>
              </h1>
              <p className="text-xl text-white/90">
                Ask questions, share knowledge, and build your learning streak with fellow students and teachers in a safe, engaging space.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="shadow-hover">
                    Get Started
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="animate-slide-up">
              <img 
                src={heroImage} 
                alt="Students collaborating and learning together" 
                className="rounded-2xl shadow-hover"
              />
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Why MindLink?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to learn better, stay focused, and grow as a student
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all hover:scale-105">
            <div className="bg-gradient-primary w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ask & Answer</h3>
            <p className="text-muted-foreground">
              Get help from peers and teachers with your questions anonymously using cute usernames
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all hover:scale-105">
            <div className="bg-gradient-secondary w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Timer className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Focus Timer</h3>
            <p className="text-muted-foreground">
              Stay productive with built-in study timers to help you concentrate on your work
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all hover:scale-105">
            <div className="bg-gradient-relax w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Relax Room</h3>
            <p className="text-muted-foreground">
              Take breaks in our calming space with relaxing music when you need to recharge
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all hover:scale-105">
            <div className="bg-accent w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-badge animate-pulse-glow">
              <Award className="w-7 h-7 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Badges</h3>
            <p className="text-muted-foreground">
              Level up by helping others! Build streaks and earn achievements for your contributions
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-primary py-16 my-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students already growing their knowledge together
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="shadow-hover">
              Join MindLink Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
