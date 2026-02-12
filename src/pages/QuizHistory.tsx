import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Trash2, Loader2} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


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

interface Attempt {
  id: string;
  participant_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export default function QuizHistory() {
  const { quizId } = useParams();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const navigate = useNavigate();


  // Load attempts
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
     DELETE SINGLE ATTEMPT
  ----------------------------------- */
  const deleteAttempt = async (id: string) => {
    setLoadingId(id);

    const { error } = await supabase
      .from("quiz_attempts")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Failed to delete attempt: " + error.message);
    } else {
      setAttempts((prev) => prev.filter((a) => a.id !== id));
    }

    setLoadingId(null);
  };

  /* -----------------------------------
     BULK DELETE ALL ATTEMPTS
  ----------------------------------- */
  const deleteAllAttempts = async () => {
    setBulkLoading(true);

    const { error } = await supabase
      .from("quiz_attempts")
      .delete()
      .eq("quiz_id", quizId);

    if (error) {
      alert("Failed to delete all attempts: " + error.message);
    } else {
      setAttempts([]); // Clear UI instantly
    }

    setBulkLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b p-4 flex items-center justify-between">
  {/* LEFT SIDE */}
  <div className="flex items-center gap-3">
    {/* ✅ BACK BUTTON */}
    <Button
      variant="ghost"
      size="icon"
      onClick={() => navigate(-1)}
      className="rounded-full"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>

    <Brain className="h-6 w-6 text-primary" />

    <h1 className="font-display text-xl font-bold ">
      Quiz Attempt History
    </h1>
  </div>

  {/* RIGHT SIDE BULK DELETE */}
  {attempts.length > 0 && (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={bulkLoading}
          className="mr-4"
        >
          {bulkLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Delete All
        </Button>
      </AlertDialogTrigger>

      {/* Dialog */}
      <AlertDialogContent className="w-[95%] max-w-md rounded-xl p-6 sm:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete all attempts?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove ALL attempts for this quiz.
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={deleteAllAttempts}
          >
            Yes, Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )}
</header>


      {/* MAIN */}
      <main className="container py-8 max-w-2xl space-y-4">
        {attempts.length === 0 ? (
          <p className="text-muted-foreground text-center">
            No one has attempted this quiz yet.
          </p>
        ) : (
          attempts.map((a) => (
            <div
              key={a.id}
              className="glass-card rounded-xl p-4 flex justify-between items-center"
            >
              {/* Left Info */}
              <div>
                <p className="font-semibold">{a.participant_name}</p>
                <p className="text-sm text-muted-foreground">
                  Score: {a.score}/{a.total_questions}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.completed_at).toLocaleString()}
                </p>
              </div>

              {/* ✅ DELETE SINGLE ATTEMPT */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={loadingId === a.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                  >
                    {loadingId === a.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </AlertDialogTrigger>

                <AlertDialogContent className="w-[95%] max-w-md rounded-xl p-6 sm:w-full">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete this attempt?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      This attempt will be permanently removed from history.
                      <br />
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteAttempt(a.id)}
                    >
                      Yes, Delete Attempt
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
