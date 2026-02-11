import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="font-display text-xl font-bold">
          Quiz Attempt History
        </h1>
      </header>

      <main className="container py-8 max-w-2xl space-y-4">
        {attempts.length === 0 ? (
          <p className="text-muted-foreground text-center">
            No one has attempted this quiz yet.
          </p>
        ) : (
          attempts.map((a) => (
            <div
              key={a.id}
              className="glass-card rounded-xl p-4 flex justify-between"
            >
              <div>
                <p className="font-semibold">{a.participant_name}</p>
                <p className="text-sm text-muted-foreground">
                  Score: {a.score}/{a.total_questions}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(a.completed_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
