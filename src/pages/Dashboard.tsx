import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";


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
  sharing_enabled?: boolean;
  show_answers?: boolean;
  prevent_tab_switch?: boolean;
  tab_switch_warnings?: number;
  prevent_copy_paste?: boolean;
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
  const [sharingEnabled, setSharingEnabled] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [preventTabSwitch, setPreventTabSwitch] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(2);

  const [preventCopyPaste, setPreventCopyPaste] = useState(false);



  /* -----------------------------------
     FETCH QUIZZES
  ----------------------------------- */
  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, share_token, created_at, duration_minutes, max_retries, sharing_enabled, show_answers, prevent_tab_switch, tab_switch_warnings, prevent_copy_paste"
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
    setSharingEnabled(quiz.sharing_enabled ?? true);
    setShowAnswers(quiz.show_answers ?? true);

    setDuration(quiz.duration_minutes ?? null);

    setPreventTabSwitch(quiz.prevent_tab_switch ?? false);
    setTabWarnings(quiz.tab_switch_warnings ?? 2);

    setPreventCopyPaste(quiz.prevent_copy_paste ?? false);


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
        sharing_enabled: sharingEnabled,
        show_answers: showAnswers,
        prevent_tab_switch: preventTabSwitch,
        tab_switch_warnings: tabWarnings,
        prevent_copy_paste: preventCopyPaste,
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
    <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl overflow-hidden animate-scale-in">

      {/* ✅ HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h2 className="font-display text-xl font-bold">
            Quiz Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure quiz rules, retries, access & exam security
          </p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSettingsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* ✅ BODY */}
      <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">

        {/* -------------------------------
            SECTION 1: TIMER
        -------------------------------- */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Time Limit
          </h3>

          <div className="rounded-xl border p-3 space-y-2">
            <label className="text-sm font-medium ml-1">
              Duration (minutes)
            </label>

            <Input
              type="number"
              placeholder="Leave empty or 0 for unlimited"
              value={duration ?? ""}
              className="text-sm"
              onChange={(e) =>
                setDuration(e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>

        {/* -------------------------------
            SECTION 2: RETRIES
        -------------------------------- */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Attempts & Retries
          </h3>

          <div className="rounded-xl border p-4 space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Retries</p>
                <p className="text-xs text-muted-foreground">
                  Allow participants to retake this quiz
                </p>
              </div>

              <Switch
                checked={retriesEnabled}
                onCheckedChange={setRetriesEnabled}
              />
            </div>

            {retriesEnabled && (
              <Input
                type="number"
                min={1}
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                placeholder="Max retries allowed"
              />
            )}
          </div>
        </div>

        {/* -------------------------------
            SECTION 3: ACCESS CONTROL
        -------------------------------- */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Access & Visibility
          </h3>

          <div className="rounded-xl border p-4 space-y-4">

            {/* Sharing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Access Link</p>
                <p className="text-xs text-muted-foreground">
                  Quiz can be opened via share link
                </p>
              </div>

              <Switch
                checked={sharingEnabled}
                onCheckedChange={setSharingEnabled}
              />
            </div>

            {/* Show Answers */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Show Correct Answers</p>
                <p className="text-xs text-muted-foreground">
                  Answer visibility after quiz completion
                </p>
              </div>

              <Switch
                checked={showAnswers}
                onCheckedChange={setShowAnswers}
              />
            </div>
          </div>
        </div>

        {/* -------------------------------
            SECTION 4: EXAM SECURITY
        -------------------------------- */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Exam Security
          </h3>

          <div className="rounded-xl border p-4 space-y-4">

            {/* Tab Switch */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Prevent Tab/App Switching
                </p>
                <p className="text-xs text-muted-foreground">
                  Auto-submit with adjustable warnings
                </p>
              </div>

              <Switch
                checked={preventTabSwitch}
                onCheckedChange={setPreventTabSwitch}
              />
            </div>

            {preventTabSwitch && (
              <Input
                type="number"
                min={1}
                value={tabWarnings}
                onChange={(e) => setTabWarnings(Number(e.target.value))}
                placeholder="Warnings before auto-submit"
              />
            )}

            {/* Copy Paste */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Disable Copy / Paste
                </p>
                <p className="text-xs text-muted-foreground">
                  Prevent right click and text selection
                </p>
              </div>

              <Switch
                checked={preventCopyPaste}
                onCheckedChange={setPreventCopyPaste}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FOOTER */}
      <div className="px-6 py-4 border-t bg-muted/30">
        <Button
          className="w-full gradient-primary text-primary-foreground"
          onClick={saveSettings}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
