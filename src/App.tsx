import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import QuizCreate from "./pages/QuizCreate";
import QuizEdit from "./pages/QuizEdit";
import QuizAttempt from "./pages/QuizAttempt";
import SharedQuiz from "./pages/SharedQuiz";
import NotFound from "./pages/NotFound";
import QuizHistory from "./pages/QuizHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={<RequireAuth><Dashboard /></RequireAuth>}
            />
            <Route
              path="/quiz/create"
              element={<RequireAuth><QuizCreate /></RequireAuth>}
            />
            <Route
              path="/quiz/edit/:quizId"
              element={<RequireAuth><QuizEdit /></RequireAuth>}
            />
            <Route
              path="/quiz/attempt/:quizId"
              element={<RequireAuth><QuizAttempt /></RequireAuth>}
            />
            <Route path="/quiz/share/:shareToken" element={<SharedQuiz />} />
            <Route path="/quiz/history/:quizId" element={<QuizHistory />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
