import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Brain,
  ArrowLeft,
  CheckCircle2,
  Timer,
  ChevronUp,
} from "lucide-react";

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

  /* --------------------------------------------
     STATE
  -------------------------------------------- */

  const [quizTitle, setQuizTitle] = useState("");

const [questions, setQuestions] = useState<Question[]>(() => {
  return JSON.parse(localStorage.getItem("creator_questions") || "[]");
});
const [answers, setAnswers] = useState<Record<string, number>>(() => {
  return JSON.parse(localStorage.getItem("creator_answers") || "{}");
});

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);

  /* TIMER */
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
const [timeLeft, setTimeLeft] = useState<number | null>(() => {
  const saved = localStorage.getItem("creator_time_left");
  return saved ? Number(saved) : null;
});

  /* NAVIGATION */
  const [navOpen, setNavOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  /* SUBMIT MODAL */
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);


  

  /* --------------------------------------------
     LOAD QUIZ + QUESTIONS
  -------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!quizId) return;

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("title, duration_minutes")
        .eq("id", quizId)
        .maybeSingle();

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_num");

      if (quiz) {
        setQuizTitle(quiz.title);

        if (quiz.duration_minutes) {
          setDurationMinutes(quiz.duration_minutes);
          const savedTime = localStorage.getItem("creator_time_left");

          if (savedTime) {
            setTimeLeft(Number(savedTime));
          } else {
            setTimeLeft(quiz.duration_minutes * 60);
          }

        }
      }

      // Save start time
      localStorage.setItem(
        "creator_quiz_start_time",
        Date.now().toString()
      );

      if (qs) {
  setQuestions(qs);

  // ✅ Save for refresh safety
  localStorage.setItem("creator_questions", JSON.stringify(qs));
}


      setLoading(false);
    };

    load();
  }, [quizId]);

  useEffect(() => {
  localStorage.setItem("creator_answers", JSON.stringify(answers));
}, [answers]);

  /* --------------------------------------------
     TIMER COUNTDOWN
  -------------------------------------------- */
  useEffect(() => {
    if (timeLeft === null) return;
    if (submitted) return;

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
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  /* --------------------------------------------
     FORMAT TIMER
  -------------------------------------------- */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

useEffect(() => {
  if (timeLeft === null) return;

  localStorage.setItem("creator_time_left", timeLeft.toString());
}, [timeLeft]);


  /* --------------------------------------------
     SELECT ANSWER
  -------------------------------------------- */
const selectAnswer = (questionId: string, optionIndex: number) => {
  if (submitted) return;

  setAnswers((prev) => {
    const updated = { ...prev, [questionId]: optionIndex };

    // ✅ Save instantly
    localStorage.setItem("creator_answers", JSON.stringify(updated));

    return updated;
  });
};


  /* --------------------------------------------
     SUBMIT WARNING LOGIC
  -------------------------------------------- */
  const unansweredCount =
    questions.length - Object.keys(answers).length;

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setOpenSubmitDialog(true);
      return;
    }

    handleSubmit(false);
  };

  /* --------------------------------------------
     SUBMIT QUIZ
  -------------------------------------------- */
  const handleSubmit = async (auto = false) => {
    let correct = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option_index) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    let timeTakenSeconds = 0;

    if (durationMinutes && timeLeft !== null) {
      timeTakenSeconds = durationMinutes * 60 - timeLeft;
    }

    const startTime = localStorage.getItem("creator_quiz_start_time");
    if (startTime) {
      timeTakenSeconds = Math.floor(
        (Date.now() - Number(startTime)) / 1000
      );
    }

    timeTakenSeconds = Math.max(timeTakenSeconds, 1);

    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId!,
      user_id: user?.id || null,
      participant_name: "Creator",
      answers,
      score: correct,
      total_questions: questions.length,
      time_taken_seconds: timeTakenSeconds,
    });

    localStorage.removeItem("creator_quiz_start_time");
    localStorage.removeItem("creator_questions");
localStorage.removeItem("creator_answers");
localStorage.removeItem("creator_time_left");
localStorage.removeItem("creator_quiz_start_time");

  };

  /* --------------------------------------------
     SCROLL TO QUESTION (HEADER SAFE)
  -------------------------------------------- */
  const scrollToQuestion = (index: number) => {
    setCurrentQuestion(index);

    const element = document.getElementById(`question-${index}`);

    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setNavOpen(false);
  };

  /* --------------------------------------------
     AUTO DETECT CURRENT QUESTION
  -------------------------------------------- */
  useEffect(() => {
    if (questions.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(
              entry.target.getAttribute("data-index")
            );
            setCurrentQuestion(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    questions.forEach((_, index) => {
      const el = document.getElementById(`question-${index}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [questions]);

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

  const optionLabels = ["A", "B", "C", "D"];

  /* --------------------------------------------
     MAIN UI
  -------------------------------------------- */
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex min-h-[4rem] py-3 items-center justify-between">
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

          {durationMinutes && timeLeft !== null && !submitted && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted text-sm font-semibold">
              <Timer className="h-4 w-4 text-primary" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      {/* MAIN */}
      <main className="container py-8 max-w-3xl mb-20 lg:max-w-5xl xl:max-w-6xl">
        {/* RESULT */}
        {submitted && (
          <div className="glass-card rounded-xl p-6 mb-6 text-center animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />

            <h2 className="font-display text-2xl font-bold">
              You scored {score}/{questions.length}
            </h2>
          </div>
        )}

        {/* QUESTIONS */}
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              id={`question-${qIndex}`}
              data-index={qIndex}
              className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-sm"
            >
              <p className="font-display font-semibold mb-3">
                <span className="text-muted-foreground mr-2">
                  {qIndex + 1}.
                </span>
                {q.question_text}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[q.id] === oIndex;

                  let borderClass =
                    "border-border hover:border-primary/30";

                  if (isSelected) {
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
                      {/* ✅ Option Circle Colors */}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          // After submission → show correct/wrong
                          submitted
                            ? q.correct_option_index === oIndex
                              ? "bg-green-600 text-white"
                              : answers[q.id] === oIndex
                              ? "bg-red-600 text-white"
                              : "bg-muted text-muted-foreground"

                            // Before submission → show selected
                            : answers[q.id] === oIndex
                            ? "bg-primary text-primary-foreground"
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

        {/* ======================================
            STICKY FOOTER + NAVIGATOR
        ====================================== */}
        {!submitted && questions.length > 0 && (
          <>
            {/* Mobile Navigator Sheet */}
            <div
              className={`fixed inset-x-0 bottom-[72px] z-40 md:hidden transition-transform duration-300 ease-in-out
              ${navOpen ? "translate-y-0" : "translate-y-full"}`}
            >
              <div className="bg-card border-t shadow-2xl rounded-t-2xl p-4">
                <div
                  className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4 cursor-pointer"
                  onClick={() => setNavOpen(false)}
                />

                <h3 className="text-sm font-semibold text-center mb-3">
                  Question Navigator
                </h3>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 justify-items-center place-content-center">
                  {questions.map((q, i) => {
                    const answered = answers[q.id] !== undefined;
                    const active = currentQuestion === i;

                    let pillClass =
                      "bg-background border border-border text-muted-foreground hover:bg-muted";

                    if (answered)
                      pillClass =
                        "bg-green-600 text-white border-green-600";

                    if (active)
                      pillClass =
                        "bg-primary text-primary-foreground border-primary";

                    return (
                      <button
                        key={q.id}
                        onClick={() => scrollToQuestion(i)}
                        className={`h-9 w-9 rounded-full text-xs font-bold transition ${pillClass}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-card/90 backdrop-blur-md p-4 z-50">
              <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between gap-4">
                {/* Answered Count */}
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Answered{" "}
                  <span className="font-semibold text-foreground">
                    {Object.keys(answers).length}/{questions.length}
                  </span>
                </p>

                {/* Desktop Navigator Pills */}
                <div className="hidden md:flex flex-1 justify-center gap-2 overflow-x-auto px-2">
                  {questions.map((q, i) => {
                    const answered = answers[q.id] !== undefined;
                    const active = currentQuestion === i;

                    let pillClass =
                      "bg-background border border-border text-muted-foreground hover:bg-muted";

                    if (answered)
                      pillClass =
                        "bg-green-600 text-white border-green-600";

                    if (active)
                      pillClass =
                        "bg-primary text-primary-foreground border-primary";

                    return (
                      <button
                        key={q.id}
                        onClick={() => scrollToQuestion(i)}
                        className={`h-8 w-8 rounded-full text-xs font-bold transition ${pillClass}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Chevron Toggle (Mobile Only) */}
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full md:hidden hover:bg-primary/90"
                  onClick={() => setNavOpen((prev) => !prev)}
                >
                  <ChevronUp
                    className={`h-5 w-5 transition-transform duration-300 ${
                      navOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Submit Button + Modal */}
                <AlertDialog
                  open={openSubmitDialog}
                  onOpenChange={setOpenSubmitDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      className="gradient-primary text-primary-foreground px-6 whitespace-nowrap"
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmitClick();
                      }}
                    >
                      Submit
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="rounded-2xl w-[92%] max-w-md mx-auto p-6 shadow-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Submit Quiz?
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        You still have{" "}
                        <b>{unansweredCount}</b> unanswered question(s).
                        <br />
                        Are you sure you want to submit?
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        Continue Quiz
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={() => {
                          setOpenSubmitDialog(false);
                          handleSubmit(false);
                        }}
                      >
                        Yes, Submit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
