import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, Sparkles, Share2, PenTool } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: PenTool,
      title: "Build Manually",
      description: "Create quizzes with full control over every question and answer.",
    },
    {
      icon: Sparkles,
      title: "AI Powered",
      description: "Generate quizzes instantly from any topic using AI.",
    },
    {
      icon: Share2,
      title: "Share Anywhere",
      description: "Share quizzes via a single link — no signup required to take them.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">Evaliq</span>
          </div>
          <Button
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
            className="gradient-primary text-primary-foreground"
          >
            {user ? "Dashboard" : "Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-20 md:py-32 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Quiz Platform
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6">
            Create quizzes in{" "}
            <span className="gradient-text">seconds</span>,
            <br />
            share with{" "}
            <span className="gradient-text">everyone</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Build quizzes manually, generate with AI, or extract from documents.
            Share via a link — anyone can take your quiz, no account needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
              className="gradient-primary text-primary-foreground text-base px-8"
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card rounded-xl p-6 text-center animate-fade-in"
            >
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
