import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import {
  Brain,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronDown,
  Download,
  Search,
} from "lucide-react";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Attempt {
  id: string;
  participant_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
  time_taken_seconds?: number;
  tab_switch_count?: number;
}

export default function QuizHistory() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // UI Controls
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"latest" | "highest">("latest");

  // Expand Groups
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  /* -----------------------------------
     LOAD ATTEMPTS
  ----------------------------------- */
  useEffect(() => {
    const loadAttempts = async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .order("completed_at", { ascending: false });

      if (data) setAttempts(data);
    };

    loadAttempts();
  }, [quizId]);

  /* -----------------------------------
     GROUP ATTEMPTS BY USER
  ----------------------------------- */
  const groupedAttempts = useMemo(() => {
    let filtered = attempts.filter((a) =>
      a.participant_name.toLowerCase().includes(search.toLowerCase())
    );

    // Sorting
    filtered = [...filtered].sort((a, b) => {
  if (filter === "highest") {
    return b.score - a.score;
  }

  return (
    new Date(b.completed_at).getTime() -
    new Date(a.completed_at).getTime()
  );
});




    // Grouping
    const groups: Record<string, Attempt[]> = {};
    filtered.forEach((a) => {
      if (!groups[a.participant_name]) groups[a.participant_name] = [];
      groups[a.participant_name].push(a);
    });

    return groups;
  }, [attempts, search, filter]);

  /* -----------------------------------
     DELETE SINGLE ATTEMPT
  ----------------------------------- */
  const deleteAttempt = async (id: string) => {
    setLoadingId(id);

    await supabase.from("quiz_attempts").delete().eq("id", id);

    setAttempts((prev) => prev.filter((a) => a.id !== id));
    setLoadingId(null);
  };

  /* -----------------------------------
     DELETE ALL ATTEMPTS FOR ONE USER
  ----------------------------------- */
  const deleteUserAttempts = async (name: string) => {
    await supabase
      .from("quiz_attempts")
      .delete()
      .eq("quiz_id", quizId)
      .eq("participant_name", name);

    setAttempts((prev) => prev.filter((a) => a.participant_name !== name));
  };


  const formatCSVTime = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) return "N/A";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}m ${secs}s`;
};

  /* -----------------------------------
     EXPORT CSV
  ----------------------------------- */
  const exportCSV = () => {
    if (attempts.length === 0) return;

    const rows = [
  ["Name", "Score", "Total Questions", "Time Taken", "Tab Switches", "Completed At"],

  ...attempts.map((a) => [
    a.participant_name,
    a.score,
    a.total_questions,
    formatCSVTime(a.time_taken_seconds),
    a.tab_switch_count ?? 0,
    `"${new Date(a.completed_at).toLocaleString()}"`,
  ]),
];

const escapeCSV = (value: any) => {
  if (value === null || value === undefined) return "";
  return `"${String(value).replace(/"/g, '""')}"`;
};


    const csvContent =
  "data:text/csv;charset=utf-8," +
  rows.map((r) => r.map(escapeCSV).join(",")).join("\n");


    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "quiz_attempts.csv";
    link.click();
  };

  const formatDuration = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) return "N/A";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}m ${secs}s`;
};


  return (
    <div className="min-h-screen bg-background">
      {/* ✅ HEADER */}
      <header className="sticky top-0 z-20 border-b bg-card/70 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>

            <div>
              <h1 className="font-display text-lg font-bold">
                Attempt History
              </h1>
              <p className="text-xs text-muted-foreground">
              {attempts.length} total attempts • Best Score:{" "}
              {attempts.length > 0
                ? Math.max(...attempts.map((a) => a.score))
                : 0}
            </p>

            </div>
          </div>

          {/* RIGHT */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={attempts.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>

      {/* ✅ MAIN */}
      <main className="container max-w-2xl py-10 space-y-6">
        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border px-3 py-2 text-sm bg-transparent"
          >
            <option value="latest">Latest Attempts</option>
            <option value="highest">Highest Scores</option>
          </select>
        </div>

        {/* EMPTY */}
        {Object.keys(groupedAttempts).length === 0 ? (
          <p className="text-muted-foreground text-center py-20">
            No attempts found.
          </p>
        ) : (
          Object.entries(groupedAttempts).map(([name, userAttempts]) => (
            <div
              key={name}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* USER HEADER */}
              <button
                onClick={() =>
                  setExpandedUser(expandedUser === name ? null : name)
                }
                className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition"
              >
                <div className="text-left">
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {userAttempts.length} attempt
                    {userAttempts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <ChevronDown
                  className={`h-5 w-5 transition ${
                    expandedUser === name ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* EXPANDED ATTEMPTS */}
              {expandedUser === name && (
                <div className="border-t px-5 py-4 space-y-3">
                  {userAttempts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div className="space-y-1">
              <p className="text-sm font-medium">
                Score: {a.score}/{a.total_questions}
              </p>

              {/* ✅ Time Taken */}
              <p className="text-xs text-muted-foreground">
                Time Taken:{" "}
                <span className="font-medium text-foreground">
                  {formatDuration(a.time_taken_seconds)}
                </span>
              </p>


              {/* ✅ Tab Switch Count */}
              <p className="text-xs text-muted-foreground">
                Tab Switches:{" "}
                <span
                  className={`font-medium ${
                    (a.tab_switch_count || 0) > 0
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {a.tab_switch_count ?? 0}
                </span>
              </p>

              {/* Completed At */}
              <p className="text-xs text-muted-foreground">
                {new Date(a.completed_at).toLocaleString()}
              </p>
            </div>


                      {/* Delete Single */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={loadingId === a.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {loadingId === a.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete this attempt?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This attempt will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive"
                              onClick={() => deleteAttempt(a.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}

                  {/* Delete All For User */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full mt-2"
                      >
                        Delete All Attempts for {name}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete all attempts for {name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove every attempt made by this user.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive"
                          onClick={() => deleteUserAttempts(name)}
                        >
                          Yes, Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
