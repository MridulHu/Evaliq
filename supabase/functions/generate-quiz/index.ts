import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, topic, numQuestions, fileData } = await req.json();

    // ✅ Gemini API Key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    let prompt = "";

    // -------------------------------
    // MODE 1: AI Quiz Generation
    // -------------------------------
    if (mode === "ai") {
      prompt = `
Generate a quiz about "${topic}" with exactly ${numQuestions || 5} questions.

Rules:
- Each question must have exactly 4 options
- Only one option is correct
- Return ONLY valid JSON (no markdown, no backticks) in this format:

{
  "title": "Quiz Title",
  "questions": [
    {
      "question_text": "Question?",
      "options": ["A", "B", "C", "D"],
      "correct_option_index": 0
    }
  ]
}
`;
    }

    // -------------------------------
    // MODE 2: OCR Quiz Extraction (OCR.space)
    // -------------------------------
    else if (mode === "ocr") {
      const OCR_SPACE_API_KEY = Deno.env.get("OCR_SPACE_API_KEY");
      if (!OCR_SPACE_API_KEY)
        throw new Error("OCR_SPACE_API_KEY not configured");

      // -------------------------------
      // Step 1: Extract Text using OCR.space
      // -------------------------------
      const formData = new FormData();
      formData.append("base64Image", fileData); // full data URL
      formData.append("language", "eng");
      formData.append("OCREngine", "2");

      const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: OCR_SPACE_API_KEY,
        },
        body: formData,
      });

      const ocrResult = await ocrResponse.json();

      const extractedText =
        ocrResult?.ParsedResults?.[0]?.ParsedText;

      if (!extractedText || extractedText.trim().length < 10) {
        console.error("OCR Result:", ocrResult);
        throw new Error("OCR failed: Could not extract readable text");
      }

      // -------------------------------
      // Step 2: Convert Extracted Text → Quiz JSON using Gemini
      // -------------------------------
      prompt = `
The following text was extracted from a quiz document:

${extractedText}

Convert it into valid JSON quiz format:

{
  "title": "Extracted Quiz",
  "questions": [
    {
      "question_text": "...",
      "options": ["A","B","C","D"],
      "correct_option_index": 0
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- Return ONLY JSON (no markdown, no backticks)
`;
    }

    // -------------------------------
    // Invalid Mode
    // -------------------------------
    else {
      throw new Error("Invalid mode. Use 'ai' or 'ocr'");
    }

    // -------------------------------
    // ✅ Gemini API Call (Text Only)
    // -------------------------------
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      throw new Error("Gemini generation failed");
    }

    const data = await response.json();

    // Gemini returns text output inside:
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("No response text from Gemini");
    }

    // -------------------------------
    // ✅ FIX: Clean Markdown Fences
    // -------------------------------
    const cleanedText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // -------------------------------
    // Parse JSON Output
    // -------------------------------
    let quiz;
    try {
      quiz = JSON.parse(cleanedText);
    } catch {
      console.error("Invalid JSON returned:", rawText);
      throw new Error("Gemini did not return valid JSON");
    }

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
