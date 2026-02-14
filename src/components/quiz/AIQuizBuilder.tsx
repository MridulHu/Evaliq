import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import ManualQuizBuilder from "./ManualQuizBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";


interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export default function AIQuizBuilder() {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState("Medium");
  const [rewriteEnabled, setRewriteEnabled] = useState(true);


  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
        topic,
        numQuestions,
        mode: "ai",

        // ✅ New Professional Controls
        difficulty,
        rewriteEnabled,
      },

      });

      if (error) throw error;

      if (data?.title && data?.questions) {
        setGeneratedTitle(data.title);
        setGeneratedQuestions(data.questions);
        toast({ title: "Quiz generated! Review and save below." });
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (err: any) {
      toast({ title: "Error generating quiz", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  if (generatedQuestions) {
    return (
      <ManualQuizBuilder
        initialTitle={generatedTitle}
        initialQuestions={generatedQuestions}
      />
    );
  }

  return (
  <div className="max-w-lg mx-auto animate-fade-in">
    <Card className="glass-card shadow-xl rounded-2xl">
      <CardContent className="p-8 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>

          <h2 className="font-display text-3xl font-bold">
            AI Quiz Generator
          </h2>

          <p className="text-muted-foreground text-sm">
            Instantly generate high-quality quizzes for any subject or level.
          </p>
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-semibold">
            Quiz Topic
          </Label>

          <Input
            id="topic"
            placeholder="e.g., Photosynthesis, World War II, Python basics"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-11"
          />

          <p className="text-xs text-muted-foreground pl-1">
            Tip: Add level keywords like “Class 12” or “NCERT”.
          </p>
        </div>

        {/* Questions Count */}
        <div className="space-y-2">
          <Label htmlFor="numQ" className="text-sm font-semibold">
            Number of Questions
          </Label>

          <Input
            id="numQ"
            type="number"
            min={1}
            max={20}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="h-11"
          />
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            Difficulty Level
          </Label>

          <div className="grid grid-cols-3 gap-2">
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all
                  ${
                    difficulty === level
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-muted/70 text-muted-foreground"
                  }
                `}
              >
                {level}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Easy = school level • Hard = competitive exams
          </p>
        </div>

        {/* Rewrite Toggle */}
        <div className="flex items-center justify-between rounded-xl border p-4 bg-muted/40">
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Plagiarism-Safe Rewrite
            </p>
            <p className="text-xs text-muted-foreground">
              Rewrites questions to prevent direct copy/search.
            </p>
          </div>

          <Switch
            checked={rewriteEnabled}
            onCheckedChange={setRewriteEnabled}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generate}
          disabled={generating}
          className="w-full h-11 rounded-xl gradient-primary text-primary-foreground text-base font-semibold"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  </div>
);

}
