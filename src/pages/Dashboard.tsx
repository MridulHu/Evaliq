import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Brain, Plus, Play, Pencil, Trash2, Share2, LogOut, Copy, Check,
} from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  share_token: string | null;
  created_at: string;
  question_count?: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, share_token, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading quizzes", description: error.message, variant: "destructive" });
    } else {
      // Get question counts
      const quizzesWithCounts = await Promise.all(
        (data || []).map(async (q) => {
          const { count } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", q.id);
          return { ...q, question_count: count || 0 };
        })
      );
      setQuizzes(quizzesWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const deleteQuiz = async (id: string) => {
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast({ title: "Quiz deleted" });
    }
  };

  const copyShareLink = (quiz: Quiz) => {
    const url = `${window.location.origin}/quiz/share/${quiz.share_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(quiz.id);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">QuizForge</span>
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

      <main className="container py-8">
        {/* Hero area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Quizzes</h1>
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

        {/* Quiz grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first quiz manually, generate one with AI, or extract from a document.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card rounded-xl p-5 flex flex-col justify-between animate-fade-in hover:shadow-xl transition-shadow"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1 line-clamp-2 text-center">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {quiz.question_count} question{quiz.question_count !== 1 ? "s" : ""} •{" "}
                    {format(new Date(quiz.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button
                    size="sm"
                    variant="default"
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

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => deleteQuiz(quiz.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
