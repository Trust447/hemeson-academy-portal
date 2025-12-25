-- Result PINs table for student/parent portal access
CREATE TABLE public.result_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pin TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMP WITH TIME ZONE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id)
);

-- Scores/Results table
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  ca1 NUMERIC(5,2) CHECK (ca1 >= 0 AND ca1 <= 20),
  ca2 NUMERIC(5,2) CHECK (ca2 >= 0 AND ca2 <= 20),
  exam NUMERIC(5,2) CHECK (exam >= 0 AND exam <= 60),
  total NUMERIC(5,2) GENERATED ALWAYS AS (COALESCE(ca1, 0) + COALESCE(ca2, 0) + COALESCE(exam, 0)) STORED,
  grade TEXT,
  teacher_comment TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, term_id)
);

-- Enable RLS
ALTER TABLE public.result_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for result_pins

-- Admins can manage all PINs
CREATE POLICY "Admins can manage result_pins" 
ON public.result_pins 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public can validate PINs (for unauthenticated portal access)
CREATE POLICY "Anyone can read pins for validation" 
ON public.result_pins 
FOR SELECT 
TO anon
USING (true);

-- Anyone can update usage_count when checking results
CREATE POLICY "Anyone can update pin usage" 
ON public.result_pins 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- RLS Policies for scores

-- Admins can manage all scores
CREATE POLICY "Admins can manage scores" 
ON public.scores 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can insert/update scores for their assigned classes
CREATE POLICY "Teachers can manage scores for assigned classes" 
ON public.scores 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_tokens tt
    WHERE tt.used_by = auth.uid()
    AND tt.class_id = scores.class_id
    AND tt.subject_id = scores.subject_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teacher_tokens tt
    WHERE tt.used_by = auth.uid()
    AND tt.class_id = scores.class_id
    AND tt.subject_id = scores.subject_id
  )
);

-- Authenticated users can view scores (with proper checks in app logic)
CREATE POLICY "Authenticated users can view scores" 
ON public.scores 
FOR SELECT 
TO authenticated 
USING (true);

-- Anonymous users can view scores (for PIN portal)
CREATE POLICY "Anonymous can view scores" 
ON public.scores 
FOR SELECT 
TO anon 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_result_pins_student ON public.result_pins(student_id);
CREATE INDEX idx_result_pins_term ON public.result_pins(term_id);
CREATE INDEX idx_scores_student ON public.scores(student_id);
CREATE INDEX idx_scores_term ON public.scores(term_id);
CREATE INDEX idx_scores_class ON public.scores(class_id);
CREATE INDEX idx_scores_subject ON public.scores(subject_id);

-- Trigger for updated_at
CREATE TRIGGER update_result_pins_updated_at
BEFORE UPDATE ON public.result_pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
BEFORE UPDATE ON public.scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate grade from total
CREATE OR REPLACE FUNCTION public.calculate_grade(total_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN total_score >= 70 THEN 'A'
    WHEN total_score >= 60 THEN 'B'
    WHEN total_score >= 50 THEN 'C'
    WHEN total_score >= 45 THEN 'D'
    WHEN total_score >= 40 THEN 'E'
    ELSE 'F'
  END
$$;