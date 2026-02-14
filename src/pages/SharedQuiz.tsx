import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, Timer } from "lucide-react";
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
  const [questions, setQuestions] = useState<Question[]>(() => {
  return JSON.parse(localStorage.getItem("quiz_questions") || "[]");
});


  // ✅ Persist answers (refresh proof)
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    return JSON.parse(localStorage.getItem("quiz_answers") || "{}");
  });

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ✅ Persist participant + started state
  const [participantName, setParticipantName] = useState(
    localStorage.getItem("quiz_participant") || ""
  );

  const [started, setStarted] = useState(
    localStorage.getItem("quiz_started") === "true"
  );

  // ✅ TIMER FIX
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // ✅ RETRIES FIX
  const [maxRetries, setMaxRetries] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const retriesLeft = Math.max(maxRetries - attemptCount, 0);

  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [preventTabSwitch, setPreventTabSwitch] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(3);
  const [preventCopyPaste, setPreventCopyPaste] = useState(false);
  const [warningCount, setWarningCount] = useState(0);


  /* --------------------------------------------
     LOAD QUIZ + SETTINGS
  -------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      if (!shareToken) return;

      const { data: quiz } = await supabase
        .from("quizzes")
        .select("id, title, duration_minutes, max_retries, sharing_enabled, show_answers, prevent_tab_switch, tab_switch_warnings, prevent_copy_paste")
        .eq("share_token", shareToken)
        .maybeSingle();

      if (!quiz) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!quiz.sharing_enabled) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      /* ✅ Save settings */
      setSharingEnabled(quiz.sharing_enabled ?? true);
      setShowAnswers(quiz.show_answers ?? true);
      setPreventTabSwitch(quiz.prevent_tab_switch ?? false);
      setTabWarnings(quiz.tab_switch_warnings ?? 3);
      setPreventCopyPaste(quiz.prevent_copy_paste ?? false);

      setQuizTitle(quiz.title);
      setQuizId(quiz.id);

      setMaxRetries(quiz.max_retries || 0);

      // ✅ Timer restore logic (refresh cannot reset timer)
      if (quiz.duration_minutes) {
        setDurationMinutes(quiz.duration_minutes);

        // ✅ Restore saved timer first
        const savedTime = localStorage.getItem("quiz_time_left");

        if (savedTime) {
          setTimeLeft(parseInt(savedTime));
        } else {
          // First attempt → start fresh timer
          setTimeLeft(quiz.duration_minutes * 60);
        }
      }


      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_num");

      if (qs) {
  setQuestions(qs);

  // ✅ Save questions for auto-submit scoring
  localStorage.setItem("quiz_questions", JSON.stringify(qs));
}

      
      setLoading(false);
    };

    load();
  }, [shareToken]);

  /* --------------------------------------------
     SAVE ANSWERS (refresh proof)
  -------------------------------------------- */
  useEffect(() => {
    localStorage.setItem("quiz_answers", JSON.stringify(answers));
  }, [answers]);

  /* --------------------------------------------
     CHECK ATTEMPTS (refresh proof)
  -------------------------------------------- */
  const checkAttempts = async () => {
    if (maxRetries === 0) return;

    const { count } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("quiz_id", quizId)
      .eq("participant_name", participantName);

    const attempts = count || 0;
    setAttemptCount(attempts);

    if (attempts >= maxRetries) {
      setBlocked(true);
    } else {
      setBlocked(false);
    }
  };

  /* ✅ Auto-block after refresh if exhausted */
  useEffect(() => {
    if (quizId && participantName.trim() && maxRetries > 0) {
      checkAttempts();
    }
  }, [quizId, participantName, maxRetries]);

  /* ✅ Toast immediately when blocked */
  useEffect(() => {
    if (blocked) {
      toast({
        title: "Maximum retries reached",
        description: "You can no longer submit this quiz.",
        variant: "destructive",
      });
    }
  }, [blocked]);

  /* --------------------------------------------
     TIMER COUNTDOWN + AUTO SUBMIT
  -------------------------------------------- */
  useEffect(() => {
    if (!started) return;
    if (submitted) return;
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      toast({
        title: "Time is up!",
        description: "Quiz auto-submitted.",
        variant: "destructive",
        duration: Infinity,
      });
      setTimeout(() => {
      handleSubmit(true);
      }, 200);

      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, submitted, started]);

  useEffect(() => {
  if (timeLeft === null) return;

  localStorage.setItem("quiz_time_left", timeLeft.toString());
}, [timeLeft]);

  useEffect(() => {
  if (!preventTabSwitch) return;
  if (submitted) return;
  if (!started) return;

  const handleVisibilityChange = () => {
    if (document.hidden) {
  const next = incrementTabSwitch(); // ✅ SAVE instantly

  toast({
    title: "Warning: Tab/App Switch Detected",
    description: `Warnings left: ${Math.max(tabWarnings - next, 0)}`,
    variant: "destructive",
    duration: Infinity,
  });

  // ✅ Auto-submit after limit reached
  if (next >= tabWarnings) {
    toast({
      title: "Auto Submitted",
      description: "Too many tab/app switches detected.",
      variant: "destructive",
    });

    handleSubmit(true);
  }
}

  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [preventTabSwitch, tabWarnings, submitted, started, toast]);


useEffect(() => {
  if (!preventCopyPaste) return;

  const blockKeys = (e: KeyboardEvent) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      ["c", "v", "x", "a"].includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
    }
  };

  document.addEventListener("keydown", blockKeys);

  return () => {
    document.removeEventListener("keydown", blockKeys);
  };
}, [preventCopyPaste]);

useEffect(() => {
  if (!preventCopyPaste) return;

  const blockRightClick = (e: MouseEvent) => {
    e.preventDefault();
  };

  document.addEventListener("contextmenu", blockRightClick, true);

  return () => {
    document.removeEventListener("contextmenu", blockRightClick, true);
  };
}, [preventCopyPaste]);



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /* --------------------------------------------
     NAME ENTRY GATE (Attempts removed here)
  -------------------------------------------- */

  if (notFound) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card p-8 rounded-xl text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">
          Quiz Not Available
        </h2>
        <p className="text-muted-foreground">
          This quiz link is invalid or sharing has been disabled by the creator.
        </p>
      </div>
    </div>
  );
}


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

          {blocked && (
            <p className="text-center text-destructive font-semibold">
              Retry limit reached. You cannot attempt again.
            </p>
          )}

          <Button
            className="w-full gradient-primary text-primary-foreground"
            disabled={!participantName.trim() || blocked}
            onClick={async () => {
              localStorage.setItem("quiz_participant", participantName);

              localStorage.setItem("quiz_tab_switches", "0");
              setWarningCount(0);


              await checkAttempts();

              if (!blocked) {
                localStorage.setItem("quiz_started", "true");
                localStorage.setItem("quiz_start_time", Date.now().toString());
                setStarted(true);
              }
            }}
          >
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------
     SELECT ANSWER (unchanged)
  -------------------------------------------- */
  const selectAnswer = (questionId: string, optionIndex: number) => {
  if (submitted) return;

  setAnswers((prev) => {
    const updated = { ...prev, [questionId]: optionIndex };

    // ✅ Save instantly (so auto-submit never misses)
    localStorage.setItem("quiz_answers", JSON.stringify(updated));

    return updated;
  });
};


const incrementTabSwitch = () => {
  const current = Number(localStorage.getItem("quiz_tab_switches") || "0");
  const next = current + 1;

  localStorage.setItem("quiz_tab_switches", next.toString());
  setWarningCount(next);

  return next;
};


  /* --------------------------------------------
     SUBMIT QUIZ (BLOCKED FIX ADDED)
  -------------------------------------------- */
  const handleSubmit = async (auto = false) => {
    if (blocked) {
      toast({
        title: "Maximum retries reached",
        description: "Submission disabled.",
        variant: "destructive",
      });
      return;
    }

    if (!auto && Object.keys(answers).length < questions.length) {  
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }

    const latestAnswers: Record<string, number> =
    auto
      ? JSON.parse(localStorage.getItem("quiz_answers") || "{}")
      : answers;

    // ✅ Always use latest questions (state OR localStorage)
      const latestQuestions: Question[] =
        questions.length > 0
          ? questions
          : JSON.parse(localStorage.getItem("quiz_questions") || "[]");

      let correct = 0;

      latestQuestions.forEach((q) => {
        if (latestAnswers[q.id] === q.correct_option_index) {
          correct++;
        }
      });


    setScore(correct);
    setSubmitted(true);

    let timeTakenSeconds = 0;

// Read remaining time from localStorage (auto-submit safe)
const savedTimeLeft = localStorage.getItem("quiz_time_left");

// If quiz has a duration timer
if (durationMinutes && savedTimeLeft) {
  timeTakenSeconds =
    durationMinutes * 60 - Number(savedTimeLeft);
}

// Backup fallback (only if duration not enabled)
else {
  const startTime = localStorage.getItem("quiz_start_time");

  if (startTime) {
    timeTakenSeconds = Math.floor(
      (Date.now() - Number(startTime)) / 1000
    );
  }
}

// Never allow 0 seconds
timeTakenSeconds = Math.max(timeTakenSeconds, 1);




    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: null,
      participant_name: participantName,
      answers: latestAnswers,
      score: correct,
      total_questions: latestQuestions.length,
      time_taken_seconds: timeTakenSeconds,
      tab_switch_count: Number(
      localStorage.getItem("quiz_tab_switches") || "0"
      ),
    });

    await checkAttempts();
    setWarningCount(0);


    // ✅ Clear stored progress after submission
    localStorage.removeItem("quiz_answers");
    localStorage.removeItem("quiz_start_time");
    localStorage.removeItem("quiz_time_left");
    localStorage.removeItem("quiz_questions");
    localStorage.removeItem("quiz_tab_switches");

  };

  /* --------------------------------------------
     RETRY FIX
  -------------------------------------------- */
 const handleRetry = async () => {
  if (maxRetries > 0 && attemptCount >= maxRetries) {
    toast({ title: "No retries left", variant: "destructive" });
    setBlocked(true);
    return;
  }

  setAnswers({});
  setSubmitted(false);
  setScore(0);
  setWarningCount(0);

  await checkAttempts();


  localStorage.removeItem("quiz_answers");
  localStorage.removeItem("quiz_time_left");
  localStorage.removeItem("quiz_start_time");
  localStorage.removeItem("quiz_questions");
  
  

  if (durationMinutes) {
    const freshTime = durationMinutes * 60;

    setTimeLeft(freshTime);

    // Save fresh timer immediately
    localStorage.setItem("quiz_time_left", freshTime.toString());
  }

  //  Reload page cleanly
  window.location.reload();
};


  const optionLabels = ["A", "B", "C", "D"];

  /* --------------------------------------------
     MAIN UI (STYLING UNCHANGED)
  -------------------------------------------- */
  return (
    <div
    className="min-h-screen bg-background"
    style={{
      userSelect: preventCopyPaste ? "none" : "auto",
      WebkitUserSelect: preventCopyPaste ? "none" : "auto",
    }}
  >
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">QuizForge</span>
          </div>

          {durationMinutes && timeLeft !== null && !submitted && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted text-sm font-semibold">
              <Timer className="h-4 w-4 text-primary" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold">{quizTitle}</h1>
          <p className="text-muted-foreground mt-1">
            {questions.length} questions
          </p>
        </div>

        {submitted && (
          <div className="glass-card rounded-xl p-6 mb-6 text-center animate-scale-in">
            <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
            <h2 className="font-display text-2xl font-bold">
              You scored {score}/{questions.length}
            </h2>

            {maxRetries > 0 && !blocked && (
            <>
              {/* ✅ Retries Left Display */}
              <p className="text-sm text-muted-foreground mt-2">
                Retries left:{" "}
                <span className="font-semibold">
                  {retriesLeft}/{maxRetries}
                </span>
              </p>

              <Button
                className="mt-4 gradient-primary text-primary-foreground"
                onClick={handleRetry}
              >
                Retry Quiz
              </Button>
            </>
          )}

          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="glass-card rounded-xl p-5 animate-fade-in"
            >
              <p
                className={`font-display font-semibold mb-3 ${
                  preventCopyPaste ? "no-copy" : ""
                }`}
              >

                <span className="text-muted-foreground mr-2">
                  {qIndex + 1}.
                </span>
                {q.question_text}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[q.id] === oIndex;
                  const isCorrect = q.correct_option_index === oIndex;

                  let borderClass = "border-border hover:border-primary/30";

                  // ✅ Selected option always stays blue (before + after submit)
                  if (isSelected) {
                    borderClass = "border-primary bg-primary/10 ring-1 ring-primary";
                  }

                  // ✅ Only reveal correct/wrong if showAnswers is enabled
                  if (submitted && showAnswers) {
                    if (isCorrect) {
                      borderClass = "border-accent bg-accent/10 ring-1 ring-accent";
                    } else if (isSelected && !isCorrect) {
                      borderClass =
                        "border-destructive bg-destructive/10 ring-1 ring-destructive";
                    }
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
                          // ✅ Exam Mode: No correct/wrong reveal
                          submitted && !showAnswers
                            ? isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"

                            // ✅ Normal Mode: Show correct + wrong after submit
                            : submitted && showAnswers
                            ? isCorrect
                              ? "bg-accent text-accent-foreground"
                              : isSelected
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted text-muted-foreground"

                            // ✅ Before submission
                            : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {optionLabels[oIndex]}
                      </span>
                      <span className={`text-sm ${preventCopyPaste ? "no-copy" : ""}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted && questions.length > 0 && (
          <Button
            onClick={() => handleSubmit(false)}
            disabled={blocked}
            className="w-full mt-6 gradient-primary text-primary-foreground"
          >
            Submit Answers
          </Button>
        )}
      </main>
    </div>
  );
}
