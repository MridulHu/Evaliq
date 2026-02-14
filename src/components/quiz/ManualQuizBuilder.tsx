import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

interface Question {
  question_text: string;
  options: string[];
  correct_option_index: number;
}

interface ManualQuizBuilderProps {
  initialTitle?: string;
  initialQuestions?: Question[];
  quizId?: string;
  isEditing?: boolean;
}

export default function ManualQuizBuilder({
  initialTitle = "",
  initialQuestions,
  quizId,
  isEditing = false,
}: ManualQuizBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || [
      { question_text: "", options: ["", "", "", ""], correct_option_index: 0 },
    ]
  );
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question_text: "", options: ["", "", "", ""], correct_option_index: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q
      )
    );
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, correct_option_index: oIndex } : q
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a quiz title", variant: "destructive" });
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast({ title: `Question ${i + 1} is empty`, variant: "destructive" });
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        toast({ title: `All options in Q${i + 1} must be filled`, variant: "destructive" });
        return;
      }
    }

    setSaving(true);

    try {
      let targetQuizId = quizId;

      if (isEditing && quizId) {
        // Update existing quiz
        await supabase.from("quizzes").update({ title }).eq("id", quizId);
        // Delete old questions and re-insert
        await supabase.from("questions").delete().eq("quiz_id", quizId);
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from("quizzes")
          .insert({ title, user_id: user!.id })
          .select("id")
          .single();
        if (error) throw error;
        targetQuizId = data.id;
      }

      // Insert questions
      const questionRows = questions.map((q, i) => ({
        quiz_id: targetQuizId!,
        question_text: q.question_text,
        options: q.options,
        correct_option_index: q.correct_option_index,
        order_num: i,
      }));

      const { error: qError } = await supabase.from("questions").insert(questionRows);
      if (qError) throw qError;

      toast({ title: isEditing ? "Quiz updated!" : "Quiz created!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }

    setSaving(false);
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold ml-2.5">Quiz Title</Label>
        <Input
          id="title"
          placeholder="e.g., Biology Chapter 5 Review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg"
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="font-display font-semibold text-sm text-muted-foreground">
                  Question {qIndex + 1}
                </span>
              </div>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Input
              placeholder="Enter your question..."
              value={q.question_text}
              onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oIndex) => (
                <div
                  key={oIndex}
                  onClick={() => setCorrectOption(qIndex, oIndex)}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all ${
                    q.correct_option_index === oIndex
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      q.correct_option_index === oIndex
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {optionLabels[oIndex]}
                  </span>
                  <Input
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 pl-1"
                    placeholder={`Option ${optionLabels[oIndex]}`}
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Click an option to mark it as correct</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={addQuestion} className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 gradient-primary text-primary-foreground"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : isEditing ? "Update Quiz" : "Save Quiz"}
        </Button>
      </div>
    </div>
  );
}
