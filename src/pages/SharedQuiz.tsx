import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  order_num: number;
}

export default function SharedQuiz() {
  const { shareToken } = useParams();
  const { toast } = useToast();
  const [quizTitle, setQuizTitle] = useState("");
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [started, setStarted] = useState(false);


  useEffect(() => {
    const load = async () => {
      if (!shareToken) return;

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("share_token", shareToken)
        .maybeSingle();

      if (!quiz) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setQuizTitle(quiz.title);
      setQuizId(quiz.id);

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_num");

      if (qs) setQuestions(qs);
      setLoading(false);
    };
    load();
  }, [shareToken]);

  // ----------------------
// Name Entry Gate
// ----------------------
if (!started) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card rounded-xl p-8 w-full max-w-md space-y-4">
        <h1 className="font-display text-2xl font-bold text-center">
          Enter Your Name
        </h1>

        <p className="text-muted-foreground text-center text-sm">
          You must enter your name before attempting this quiz.
        </p>

        <input
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          placeholder="Your full name"
          className="w-full border rounded-lg p-3"
        />

        <Button
          className="w-full gradient-primary text-primary-foreground"
          disabled={!participantName.trim()}
          onClick={() => setStarted(true)}
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
}


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

    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: null,
      participant_name: participantName,
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

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-8">
        <Brain className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Quiz Not Found</h1>
        <p className="text-muted-foreground">This quiz link is invalid or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-3">
          <Brain className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold">QuizForge</span>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold">{quizTitle}</h1>
          <p className="text-muted-foreground mt-1">{questions.length} questions</p>
        </div>

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
                ? "Good job!"
                : "Keep learning!"}
            </p>
            <Button
              className="mt-4 gradient-primary text-primary-foreground"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setScore(0);
              }}
            >
              Retry Quiz
            </Button>
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
