import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Loader2, Plus, ArrowRight } from "lucide-react";
import ManualQuizBuilder from "./ManualQuizBuilder";

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_option_index: number;
}

export default function OCRQuizBuilder() {
  const [processing, setProcessing] = useState(false);

  // Store all extracted questions
  const [generatedTitle, setGeneratedTitle] = useState("Extracted Quiz");
  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestion[]>([]);

  const [fileName, setFileName] = useState("");
  const [readyToEdit, setReadyToEdit] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // -------------------------------
  // Handle Upload + Append Questions
  // -------------------------------
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);

    try {
      // Convert file → base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { mode: "ocr", fileData: base64, fileName: file.name },
      });

      if (error) throw error;

      if (data?.questions) {
        // Set title only once (first upload)
        if (generatedQuestions.length === 0 && data.title) {
          setGeneratedTitle(data.title);
        }

        // Append new questions
        setGeneratedQuestions((prev) => [...prev, ...data.questions]);

        toast({
          title: "Questions added!",
          description: `${data.questions.length} questions extracted from ${file.name}`,
        });
      } else {
        throw new Error("Could not extract questions from document");
      }
    } catch (err: any) {
      toast({
        title: "Error processing document",
        description: err.message,
        variant: "destructive",
      });
    }

    setProcessing(false);

    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  // -------------------------------
  // If user clicks Continue → Manual Builder
  // -------------------------------
  if (readyToEdit) {
    return (
      <ManualQuizBuilder
        initialTitle={generatedTitle}
        initialQuestions={generatedQuestions}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-accent-foreground" />
        </div>

        <h2 className="font-display text-2xl font-bold">
          Import from Document
        </h2>

        <p className="text-muted-foreground mt-1">
          Upload multiple images/PDFs to extract quiz questions.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />

      {/* Upload Box */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={processing}
        className="w-full glass-card rounded-xl p-8 flex flex-col items-center gap-3 hover:shadow-xl transition-all border-2 border-dashed border-border hover:border-primary/40"
      >
        {processing ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="font-medium">Processing {fileName}...</p>
            <p className="text-sm text-muted-foreground">
              Extracting questions...
            </p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">
              {generatedQuestions.length === 0
                ? "Click to upload"
                : "Add another document"}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports images (JPG, PNG) and PDF files
            </p>
          </>
        )}
      </button>

      {/* Show extracted count */}
      {generatedQuestions.length > 0 && (
      <div className="glass-card rounded-xl p-5 space-y-4">
        {/* Extracted Count */}
        <p className="font-semibold text-center">
          {generatedQuestions.length} questions extracted so far
        </p>

        {/* Preview Box */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-3 space-y-3 bg-muted/30">
          {generatedQuestions.slice(0, 5).map((q, index) => (
            <div key={index} className="text-sm space-y-1">
              <p className="font-medium">
                {index + 1}. {q.question_text}
              </p>

              <ul className="ml-4 list-disc text-muted-foreground">
                {q.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            </div>
          ))}

          {/* If More Than 5 */}
          {generatedQuestions.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Showing first 5 questions... Continue to edit full quiz.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-center">
          {/* Add More */}
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add More
          </Button>

          {/* Continue */}
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => setReadyToEdit(true)}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    )}

    </div>
  );
}
