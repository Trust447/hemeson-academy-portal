import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Key, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Link } from "react-router-dom";

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
      const { data, error: fnError } = await supabase.functions.invoke('validate-teacher-token', {
        body: { token: token.trim().toUpperCase() }
      });

      if (fnError) {
        setError(fnError.message || "Failed to validate token");
        return;
      }

      if (data?.error || !data?.valid) {
        setError(data?.error || "Invalid token");
        return;
      }

      // Store token data in session storage and navigate to score entry
      sessionStorage.setItem('teacherTokenData', JSON.stringify({
        token: token.trim().toUpperCase(),
        ...data.token,
        students: data.students
      }));

      toast({
        title: "Token Validated",
        description: `Welcome! You can now enter scores for ${data.token.class?.level} ${data.token.subject?.name}`,
      });

      navigate('/teacher/scores');

    } catch (err) {
      console.error('Token validation error:', err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <img src="/hemeson-logo.png" alt="" className="w-16 h-18" />
              </div>
            </Link>
          </div>
          <CardTitle className="text-2xl font-display">Teacher Portal</CardTitle>
          <CardDescription>
            Enter your unique token to access score entry
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your token (e.g., ABC123XY)"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setError(null);
                }}
                disabled={isLoading}
                className={`font-mono text-center text-lg tracking-widest ${error ? 'border-destructive' : ''}`}
                maxLength={12}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !token.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validate Token
            </Button>
          </CardContent>
        </form>

        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
            <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Tokens are provided by the school admin and are valid for one-time score submission.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}