import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Loader2, Plus, ArrowRight } from "lucide-react";
import ManualQuizBuilder from "./ManualQuizBuilder";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const PREVIEW_LIMIT = 10;

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
  <div className="max-w-lg mx-auto animate-fade-in">
    <Card className="glass-card rounded-2xl shadow-xl">
      <CardContent className="p-8 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          

          <h2 className="font-display text-3xl font-bold">
            Import from Document
          </h2>

          <p className="text-sm text-muted-foreground">
            Upload images or PDFs and instantly extract quiz questions.
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

        {/* Upload Dropzone */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className={`w-full rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 transition-all
            ${
              processing
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }
          `}
        >
          {processing ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold text-base">
                Processing {fileName}...
              </p>
              <p className="text-xs text-muted-foreground">
                Extracting questions, please wait
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-base">
                {generatedQuestions.length === 0
                  ? "Click to upload a document"
                  : "Upload another document"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, and PDF files
              </p>
            </>
          )}
        </button>

        {/* Extracted Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div className="space-y-5">

            {/* Count Badge */}
            <div className="flex justify-center">
              <Badge className="px-4 py-1 text-sm rounded-full">
                {generatedQuestions.length} Questions Extracted
              </Badge>
            </div>

            {/* Preview Box */}
            <div className="rounded-xl border bg-muted/20 p-4 max-h-72 overflow-y-auto space-y-4">
              {generatedQuestions.slice(0, PREVIEW_LIMIT).map((q, index) => (
                <div
                  key={index}
                  className="rounded-lg p-3 bg-background/70 border shadow-sm"
                >
                  <p className="font-medium text-sm">
                    {index + 1}. {q.question_text}
                  </p>

                  <ul className="mt-2 ml-5 list-disc text-xs text-muted-foreground space-y-1">
                    {q.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              ))}

              {generatedQuestions.length > PREVIEW_LIMIT && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing first {PREVIEW_LIMIT} questions. Continue to edit the full quiz.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => fileRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add More
              </Button>

              <Button
                className="rounded-xl gradient-primary text-primary-foreground"
                onClick={() => setReadyToEdit(true)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

}
