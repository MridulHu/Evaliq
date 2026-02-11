import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import ManualQuizBuilder from "@/components/quiz/ManualQuizBuilder";

export default function QuizEdit() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!quizId) return;

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("title")
        .eq("id", quizId)
        .maybeSingle();

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_num");

      if (quiz) setTitle(quiz.title);
      if (qs) {
        setQuestions(
          qs.map((q) => ({
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <span className="font-display text-lg font-bold">Edit Quiz</span>
        </div>
      </header>
      <main className="container py-8 max-w-3xl">
        <ManualQuizBuilder
          initialTitle={title}
          initialQuestions={questions}
          quizId={quizId}
          isEditing
        />
      </main>
    </div>
  );
}
