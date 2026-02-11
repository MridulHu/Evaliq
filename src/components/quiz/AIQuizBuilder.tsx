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

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: "Please enter a topic", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { topic, numQuestions, mode: "ai" },
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
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">AI Quiz Generator</h2>
        <p className="text-muted-foreground mt-1">
          Enter a topic and we'll generate a quiz for you.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic</Label>
        <Input
          id="topic"
          placeholder="e.g., Photosynthesis, World War II, Python basics"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numQ">Number of Questions</Label>
        <Input
          id="numQ"
          type="number"
          min={1}
          max={20}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
        />
      </div>

      <Button
        onClick={generate}
        disabled={generating}
        className="w-full gradient-primary text-primary-foreground"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Quiz
          </>
        )}
      </Button>
    </div>
  );
}
