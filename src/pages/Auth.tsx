import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else if (isSignUp) {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to verify your account.",
      });
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary-foreground" />
          <span className="font-display text-2xl font-bold text-primary-foreground">QuizForge</span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight text-primary-foreground mb-4">
            Create, share, and master knowledge.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Build quizzes manually, generate them with AI, or extract from documents. Share with anyone via a single link.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">Created by Mridul Das.</p>
      </div>

      {/* Right - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Brain className="h-7 w-7 text-primary" />
            <span className="font-display text-xl font-bold">QuizForge</span>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignUp
              ? "Start creating and sharing quizzes today."
              : "Sign in to access your quizzes."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
