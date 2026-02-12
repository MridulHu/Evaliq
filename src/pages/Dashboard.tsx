import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

import {
  Brain,
  Plus,
  Play,
  Pencil,
  Trash2,
  Share2,
  LogOut,
  Check,
  Settings,
  X,
  Save,
} from "lucide-react";

import { format } from "date-fns";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


interface Quiz {
  id: string;
  title: string;
  share_token: string | null;
  created_at: string;
  question_count?: number;

  // ✅ Settings fields
  duration_minutes?: number | null;
  max_retries?: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ✅ Modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // ✅ Form state
  const [duration, setDuration] = useState<number | null>(null);
  const [retriesEnabled, setRetriesEnabled] = useState(false);
  const [maxRetries, setMaxRetries] = useState(0);

  /* -----------------------------------
     FETCH QUIZZES
  ----------------------------------- */
  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, share_token, created_at, duration_minutes, max_retries"
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading quizzes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const quizzesWithCounts = await Promise.all(
        (data || []).map(async (q) => {
          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", q.id);

          return {
            ...q,
            question_count: count || 0,
          };
        })
      );

      setQuizzes(quizzesWithCounts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  /* -----------------------------------
     DELETE QUIZ
  ----------------------------------- */
  const deleteQuiz = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting quiz",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast({ title: "Quiz deleted" });
    }
  };

  /* -----------------------------------
     SHARE LINK
  ----------------------------------- */
  const copyShareLink = (quiz: Quiz) => {
    const url = `${window.location.origin}/quiz/share/${quiz.share_token}`;
    navigator.clipboard.writeText(url);

    setCopiedId(quiz.id);
    toast({ title: "Link copied!" });

    setTimeout(() => setCopiedId(null), 2000);
  };

  /* -----------------------------------
     OPEN SETTINGS MODAL
  ----------------------------------- */
  const openSettings = (quiz: Quiz) => {
    setSelectedQuiz(quiz);

    setDuration(quiz.duration_minutes ?? null);

    const retries = quiz.max_retries || 0;
    setRetriesEnabled(retries > 0);
    setMaxRetries(retries);

    setSettingsOpen(true);
  };

  /* -----------------------------------
     SAVE SETTINGS
  ----------------------------------- */
  const saveSettings = async () => {
    if (!selectedQuiz) return;

    const finalRetries = retriesEnabled ? maxRetries : 0;

    const { error } = await supabase
      .from("quizzes")
      .update({
        duration_minutes: duration,
        max_retries: finalRetries,
      })
      .eq("id", selectedQuiz.id);

    if (error) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Quiz settings updated!" });

    setSettingsOpen(false);
    fetchQuizzes();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            <Brain className="h-7 w-7 text-primary" />

            <span className="font-display text-xl font-bold hover:opacity-80 transition">
              QuizForge
            </span>
          </div>


          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>

            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container py-8">
        {/* HERO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="text-center sm:text-left">
  <h1 className="font-display text-3xl font-bold">
    My Quizzes
  </h1>

  <p className="text-muted-foreground mt-1">
    {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} created
  </p>
</div>


          <Button
            onClick={() => navigate("/quiz/create")}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </div>

        {/* QUIZ GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No quizzes yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first quiz manually, generate one with AI, or extract from a document.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card rounded-xl p-5 flex flex-col justify-between hover:shadow-xl transition-shadow"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold text-center">
                    {quiz.title}
                  </h3>

                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {quiz.question_count} questions •{" "}
                    {format(new Date(quiz.created_at), "MMM d, yyyy")}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button
                    size="sm"
                    className="gradient-primary text-primary-foreground"
                    onClick={() => navigate(`/quiz/attempt/${quiz.id}`)}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Attempt
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyShareLink(quiz)}
                  >
                    {copiedId === quiz.id ? (
                      <Check className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <Share2 className="mr-1 h-3.5 w-3.5" />
                    )}
                    Share
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/quiz/history/${quiz.id}`)}
                  >
                    History
                  </Button>

                  {/* ✅ SETTINGS BUTTON */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openSettings(quiz)}
                  >
                    <Settings className="mr-1 h-3.5 w-3.5" />
                    Settings
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>

                    {/* ✅ FIXED CONTENT */}
                    <AlertDialogContent
                      className="w-[95%] max-w-md rounded-xl p-6 sm:w-full"
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this quiz?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This action cannot be undone.
                          <br />
                          All questions and attempt history will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter className="gap-2 sm:gap-0 ">
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteQuiz(quiz.id)}
                        >
                          Yes, Delete Quiz
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =========================================
          ✅ SETTINGS MODAL OVERLAY
      ========================================= */}
      {settingsOpen && selectedQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">
                Quiz Settings
              </h2>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Duration */}
            <div className="space-y-2 mb-4">
              <label className="font-semibold text-sm">
                Duration (minutes)
              </label>
              <Input
                type="number"
                placeholder="Leave empty for unlimited"
                value={duration ?? ""}
                onChange={(e) =>
                  setDuration(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              />
            </div>

            {/* Retries */}
            <div className="space-y-2 mb-4">
              <label className="font-semibold text-sm">
                Enable Retries
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={retriesEnabled}
                  onChange={(e) => setRetriesEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">
                  Allow users to retry quiz
                </span>
              </div>

              {retriesEnabled && (
                <Input
                  type="number"
                  min={1}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  placeholder="Max retries"
                />
              )}
            </div>

            {/* Save */}
            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={saveSettings}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
