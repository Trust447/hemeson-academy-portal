-- Fix calculate_grade function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_grade(total_score NUMERIC)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
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