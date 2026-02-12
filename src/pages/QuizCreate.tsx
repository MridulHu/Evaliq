  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { useAuth } from "@/lib/auth";
  import { Button } from "@/components/ui/button";
  import { Brain, PenTool, Sparkles, FileText, ArrowLeft } from "lucide-react";
  import ManualQuizBuilder from "@/components/quiz/ManualQuizBuilder";
  import AIQuizBuilder from "@/components/quiz/AIQuizBuilder";
  import OCRQuizBuilder from "@/components/quiz/OCRQuizBuilder";

  type Method = "choose" | "manual" | "ai" | "ocr";

  export default function QuizCreate() {
    const [method, setMethod] = useState<Method>("choose");
    const navigate = useNavigate();

    const methods = [
      {
        id: "manual" as const,
        icon: PenTool,
        title: "Manual Creation",
        description: "Build your quiz question by question with full control.",
      },
      {
        id: "ai" as const,
        icon: Sparkles,
        title: "AI Generated",
        description: "Enter a topic and let AI create questions for you.",
      },
      {
        id: "ocr" as const,
        icon: FileText,
        title: "From Document",
        description: "Upload an image or PDF to extract quiz questions.",
      },
    ];

    if (method !== "choose") {
      return (
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container flex h-16 items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setMethod("choose")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">
                {method === "manual" ? "Manual Creation" : method === "ai" ? "AI Generator" : "Document Import"}
              </span>
            </div>
          </header>
          <main className="container py-8 max-w-3xl">
            {method === "manual" && <ManualQuizBuilder />}
            {method === "ai" && <AIQuizBuilder />}
            {method === "ocr" && <OCRQuizBuilder />}
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container flex h-16 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">Create Quiz</span>
          </div>
        </header>

        <main className="container py-12 max-w-3xl">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="font-display text-3xl font-bold mb-2">How would you like to create your quiz?</h1>
            <p className="text-muted-foreground">Choose a method to get started.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="glass-card rounded-xl p-6 text-left hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in group"
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <m.icon className="h-6 w-6 text-primary-foreground " />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1 text-center">{m.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{m.description}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }
