import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, CheckCircle2, Timer } from "lucide-react";

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

  // ✅ TIMER STATES
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  /* --------------------------------------------
     LOAD QUIZ + QUESTIONS + TIMER SETTINGS
  -------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!quizId) return;

      // ✅ Fetch quiz title + duration
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("title, duration_minutes")
        .eq("id", quizId)
        .maybeSingle();

      // Fetch questions
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_num");

      if (quiz) {
        setQuizTitle(quiz.title);

        // ✅ Setup timer if duration exists
        if (quiz.duration_minutes) {
          setDurationMinutes(quiz.duration_minutes);
          setTimeLeft(quiz.duration_minutes * 60);
        }
      }

      if (qs) setQuestions(qs);

      setLoading(false);
    };

    load();
  }, [quizId]);

  /* --------------------------------------------
     TIMER COUNTDOWN EFFECT
  -------------------------------------------- */
  useEffect(() => {
    if (!timeLeft) return;
    if (submitted) return;

    // Stop if already finished
    if (timeLeft <= 0) {
      toast({
        title: "Time is up!",
        description: "Quiz auto-submitted.",
        variant: "destructive",
      });
      handleSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  /* --------------------------------------------
     FORMAT TIMER MM:SS
  -------------------------------------------- */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /* --------------------------------------------
     SELECT ANSWER
  -------------------------------------------- */
  const selectAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  /* --------------------------------------------
     SUBMIT QUIZ
  -------------------------------------------- */
  const handleSubmit = async (auto = false) => {
    if (!auto && Object.keys(answers).length < questions.length) {
      toast({
        title: "Please answer all questions",
        variant: "destructive",
      });
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
      participant_name: `Creator`,
      answers,
      score: correct,
      total_questions: questions.length,
    });
  };

  const optionLabels = ["A", "B", "C", "D"];

  /* --------------------------------------------
     LOADING SCREEN
  -------------------------------------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  /* --------------------------------------------
     MAIN UI
  -------------------------------------------- */
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Brain className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">
              {quizTitle}
            </span>
          </div>

          {/* ✅ TIMER RIGHT */}
          {durationMinutes && timeLeft !== null && !submitted && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted text-sm font-semibold">
              <Timer className="h-4 w-4 text-primary" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="container py-8 max-w-3xl">
        {/* RESULT */}
        {submitted && (
          <div className="glass-card rounded-xl p-6 mb-6 text-center animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />

            <h2 className="font-display text-2xl font-bold">
              You scored {score}/{questions.length}
            </h2>

            <p className="text-muted-foreground mt-1">
              {score === questions.length
                ? "Perfect score! "
                : score >= questions.length / 2
                ? "Good job! ."
                : "Keep learning!"}
            </p>

            <div className="flex gap-3 justify-center mt-4 flex-wrap">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>

              <Button
                className="gradient-primary text-primary-foreground"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  setScore(0);

                  // Reset timer
                  if (durationMinutes) {
                    setTimeLeft(durationMinutes * 60);
                  }
                }}
              >
                Retry Quiz
              </Button>
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="glass-card rounded-xl p-5">
              <p className="font-display font-semibold mb-3">
                <span className="text-muted-foreground mr-2">
                  {qIndex + 1}.
                </span>
                {q.question_text}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[q.id] === oIndex;
                  const isCorrect = q.correct_option_index === oIndex;

                  let borderClass =
                    "border-border hover:border-primary/30";

                  if (submitted) {
                    if (isCorrect)
                      borderClass =
                        "border-accent bg-accent/10 ring-1 ring-accent";
                    else if (isSelected && !isCorrect)
                      borderClass =
                        "border-destructive bg-destructive/10 ring-1 ring-destructive";
                  } else if (isSelected) {
                    borderClass =
                      "border-primary bg-primary/10 ring-1 ring-primary";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => selectAnswer(q.id, oIndex)}
                      disabled={submitted}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${borderClass}`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-muted">
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

        {/* SUBMIT BUTTON */}
        {!submitted && questions.length > 0 && (
          <Button
            onClick={() => handleSubmit(false)}
            className="w-full mt-6 gradient-primary text-primary-foreground"
          >
            Submit Answers
          </Button>
        )}
      </main>
    </div>
  );
}
