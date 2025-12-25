-- Add policies for teachers to view and claim their tokens
CREATE POLICY "Teachers can view unclaimed or owned tokens" 
ON public.teacher_tokens 
FOR SELECT 
TO authenticated 
USING (
  (is_used = false) 
  OR (used_by = auth.uid())
);

-- Allow teachers to claim unclaimed tokens
CREATE POLICY "Teachers can claim tokens" 
ON public.teacher_tokens 
FOR UPDATE 
TO authenticated 
USING (is_used = false)
WITH CHECK (
  is_used = true 
  AND used_by = auth.uid()
  AND public.has_role(auth.uid(), 'teacher')
);

-- Create audit log for profile access (for security monitoring)
CREATE TABLE public.profile_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.profile_access_log 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (will be done via edge function with service role)
CREATE POLICY "System can insert audit logs" 
ON public.profile_access_log 
FOR INSERT 
TO authenticated 
WITH CHECK (accessed_by = auth.uid());

-- Create index for efficient querying
CREATE INDEX idx_profile_access_log_accessed_by ON public.profile_access_log(accessed_by);
CREATE INDEX idx_profile_access_log_profile_id ON public.profile_access_log(profile_id);
CREATE INDEX idx_profile_access_log_accessed_at ON public.profile_access_log(accessed_at DESC);