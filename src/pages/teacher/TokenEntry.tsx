import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const tokenSchema = z.object({
  token: z.string()
    .min(8, "Token must be at least 8 characters")
    .max(12, "Token must be at most 12 characters")
    .regex(/^[A-Z0-9]+$/i, "Token must be alphanumeric")
});

export default function TeacherTokenEntry() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = tokenSchema.safeParse({ token: token.trim() });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      // 1. DIRECT DATABASE CHECK (Replacing the Edge Function)
      const { data: tokenData, error: dbError } = await supabase
        .from('teacher_tokens')
        .select(`
          *,
          classes (id, level),
          subjects (id, name)
        `)
        .eq('token', token.trim().toUpperCase())
        .single();

      if (dbError || !tokenData) {
        setError("Invalid token. Please contact the Admin.");
        setIsLoading(false);
        return;
      }

      if (tokenData.is_used) {
        setError("This token has already been used.");
        setIsLoading(false);
        return;
      }

      // 2. FETCH STUDENTS FOR THIS CLASS
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, admission_number')
        .eq('class_id', tokenData.class_id)
        .order('full_name', { ascending: true });

      if (studentError) {
        console.error("Error fetching students:", studentError);
      }

      // 3. STORE SESSION DATA
      // This matches what your /teacher/scores page expects to find
      sessionStorage.setItem('teacherTokenData', JSON.stringify({
        token: tokenData.token,
        class_id: tokenData.class_id,
        subject_id: tokenData.subject_id,
        class_info: tokenData.classes,
        subject_info: tokenData.subjects,
        student_list: students || []
      }));

      toast({
        title: "Access Granted",
        description: `Welcome! Score sheet ready for ${tokenData.classes?.level} ${tokenData.subjects?.name}`,
      });

      // 4. NAVIGATE TO SCORING PAGE
      navigate('/teacher/scores');

    } catch (err) {
      console.error('Validation error:', err);
      setError("An unexpected connection error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Link to="/">
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-all border border-slate-100">
                <img src="/hemeson-logo.png" alt="Logo" className="w-16 h-18 object-contain" />
              </div>
            </Link>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-display font-bold">Teacher Portal</CardTitle>
            <CardDescription>
              Enter your unique token to record student marks.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token" className="text-slate-700">Access Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="E.G. MATH-JSS1-ABC"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setError(null);
                }}
                disabled={isLoading}
                className={`h-12 font-mono text-center text-lg tracking-widest ${error ? 'border-destructive ring-destructive' : ''}`}
                maxLength={12}
              />
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center font-medium">
                  {error}
                </motion.p>
              )}
            </div>

            <Button type="submit" className="w-full h-12 text-md" disabled={isLoading || !token.trim()}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
              ) : (
                "Access Score Sheet"
              )}
            </Button>
          </CardContent>
        </form>

        <div className="px-6 pb-8">
          <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <GraduationCap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Tokens are issued by the Admin and are linked to a specific class and subject. 
              They expire once you complete a final submission.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}