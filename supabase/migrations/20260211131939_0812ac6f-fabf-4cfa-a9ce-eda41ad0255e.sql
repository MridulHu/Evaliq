
-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  share_token TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table (options stored as text array for simplicity)
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL DEFAULT '{}',
  correct_option_index INTEGER NOT NULL DEFAULT 0,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Helper: check quiz ownership
CREATE OR REPLACE FUNCTION public.is_quiz_owner(_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE id = _quiz_id AND user_id = auth.uid()
  )
$$;

-- Helper: check quiz access (owner OR has share_token)
CREATE OR REPLACE FUNCTION public.can_access_quiz(_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE id = _quiz_id AND (user_id = auth.uid() OR share_token IS NOT NULL)
  )
$$;

-- Quizzes RLS policies
CREATE POLICY "Users can view own quizzes" ON public.quizzes
  FOR SELECT USING (user_id = auth.uid() OR share_token IS NOT NULL);

CREATE POLICY "Users can create quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes" ON public.quizzes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own quizzes" ON public.quizzes
  FOR DELETE USING (user_id = auth.uid());

-- Questions RLS policies
CREATE POLICY "Users can view questions of accessible quizzes" ON public.questions
  FOR SELECT USING (public.can_access_quiz(quiz_id));

CREATE POLICY "Users can create questions for own quizzes" ON public.questions
  FOR INSERT WITH CHECK (public.is_quiz_owner(quiz_id));

CREATE POLICY "Users can update questions of own quizzes" ON public.questions
  FOR UPDATE USING (public.is_quiz_owner(quiz_id));

CREATE POLICY "Users can delete questions of own quizzes" ON public.questions
  FOR DELETE USING (public.is_quiz_owner(quiz_id));

-- Quiz attempts RLS policies
CREATE POLICY "Anyone can create quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (public.can_access_quiz(quiz_id));

CREATE POLICY "Users can view own attempts" ON public.quiz_attempts
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate share_token on quiz creation
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.share_token = encode(gen_random_bytes(16), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_share_token
  BEFORE INSERT ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_share_token();
