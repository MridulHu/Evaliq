import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  order_num: number;
}

export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!quizId) return;
      const { data: quiz } = await supabase.from("quizzes").select("title").eq("id", quizId).maybeSingle();
      const { data: qs } = await supabase.from("questions").select("*").eq("quiz_id", quizId).order("order_num");
      if (quiz) setQuizTitle(quiz.title);
      if (qs) setQuestions(qs);
      setLoading(false);
    };
    load();
  }, [quizId]);

  const selectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option_index) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    // Save attempt
    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId!,
      user_id: user?.id || null,
      participant_name: `Author (${user?.email})`,
      answers: answers,
      score: correct,
      total_questions: questions.length,
    });
  };

  const optionLabels = ["A", "B", "C", "D"];

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
          <span className="font-display text-lg font-bold">{quizTitle}</span>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        {submitted && (
          <div className="glass-card rounded-xl p-6 mb-6 text-center animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold">
              You scored {score}/{questions.length}
            </h2>
            <p className="text-muted-foreground mt-1">
              {score === questions.length
                ? "Perfect score! 🎉"
                : score >= questions.length / 2
                ? "Good job! Keep practicing."
                : "Keep learning, you'll do better next time!"}
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  setScore(0);
                }}
              >
                Retry Quiz
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="glass-card rounded-xl p-5 animate-fade-in">
              <p className="font-display font-semibold mb-3">
                <span className="text-muted-foreground mr-2">{qIndex + 1}.</span>
                {q.question_text}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[q.id] === oIndex;
                  const isCorrect = q.correct_option_index === oIndex;
                  let borderClass = "border-border hover:border-primary/30";
                  if (submitted) {
                    if (isCorrect) borderClass = "border-accent bg-accent/10 ring-1 ring-accent";
                    else if (isSelected && !isCorrect)
                      borderClass = "border-destructive bg-destructive/10 ring-1 ring-destructive";
                  } else if (isSelected) {
                    borderClass = "border-primary bg-primary/10 ring-1 ring-primary";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => selectAnswer(q.id, oIndex)}
                      disabled={submitted}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${borderClass}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected || (submitted && isCorrect)
                            ? submitted && isCorrect
                              ? "bg-accent text-accent-foreground"
                              : submitted && isSelected
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {optionLabels[oIndex]}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted && questions.length > 0 && (
          <Button
            onClick={handleSubmit}
            className="w-full mt-6 gradient-primary text-primary-foreground"
          >
            Submit Answers
          </Button>
        )}
      </main>
    </div>
  );
}
