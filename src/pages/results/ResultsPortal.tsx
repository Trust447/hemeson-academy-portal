import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Lock, Loader2, AlertCircle, Phone, } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import ResultCard from "@/components/results/ResultCard";
import { Link } from "react-router-dom";
const pinSchema = z.object({
  admission_number: z.string()
    .min(1, "Admission number is required")
    .max(50, "Admission number too long")
    .regex(/^[A-Z0-9/\-]+$/i, "Invalid admission number format"),
  pin: z.string()
    .min(4, "PIN must be at least 4 characters")
    .max(20, "PIN must be at most 20 characters")
    .regex(/^[A-Z0-9]+$/i, "PIN must be alphanumeric")
});

interface ResultData {
  student: {
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    class: { level: string; section: string };
  };
  term: {
    id: string;
    type: string;
    session: { name: string };
  };
  scores: Array<{
    id: string;
    ca1: number;
    ca2: number;
    exam: number;
    total: number;
    grade: string;
    teacher_comment?: string;
    subjects: { id: string; name: string; code: string };
  }>;
  usage: {
    count: number;
    max: number;
    remaining: number;
  };
}

export default function ResultsPortal() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageExceeded, setUsageExceeded] = useState(false);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsageExceeded(false);

    const result = pinSchema.safeParse({
      admission_number: admissionNumber.trim(),
      pin: pin.trim()
    });

    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-result-pin', {
        body: {
          admission_number: admissionNumber.trim().toUpperCase(),
          pin: pin.trim()
        }
      });

      if (fnError) {
        setError(fnError.message || "Failed to validate credentials");
        return;
      }

      if (data?.usage_exceeded) {
        setUsageExceeded(true);
        setError(data.error);
        return;
      }

      if (data?.error || !data?.valid) {
        setError(data?.error || "Invalid credentials");
        return;
      }

      // Show results
      setResultData(data);

      toast({
        title: "Results Loaded",
        description: `Viewing ${data.usage.remaining} more time(s) remaining.`,
      });

    } catch (err) {
      console.error('Validation error:', err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // If we have result data, show the result card
  if (resultData) {
    return (
      <ResultCard
        data={resultData}
        onBack={() => setResultData(null)}
      />
    );
  }

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
          <CardTitle className="text-2xl font-display">PinGuard Portal</CardTitle>
          <CardDescription>
            Check your academic results securely
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admission">Admission Number</Label>
              <Input
                id="admission"
                type="text"
                placeholder="e.g., HMA/2025/001"
                value={admissionNumber}
                onChange={(e) => {
                  setAdmissionNumber(e.target.value.toUpperCase());
                  setError(null);
                }}
                disabled={isLoading}
                className={`font-mono ${error && !usageExceeded ? 'border-destructive' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Result PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  disabled={isLoading}
                  className={`pl-10 font-mono ${error && !usageExceeded ? 'border-destructive' : ''}`}
                />
              </div>
            </div>

            {error && !usageExceeded && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {usageExceeded && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-destructive font-medium">
                  <AlertCircle className="h-5 w-5" />
                  PIN Usage Limit Reached
                </div>
                <p className="text-sm text-muted-foreground">
                  Your PIN has been used the maximum number of times. Please contact the school admin to get a new PIN.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="tel:+2341234567890">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Admin
                  </a>
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !admissionNumber.trim() || !pin.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              View Results
            </Button>
          </CardContent>
        </form>

        <div className="px-6 pb-6">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Your PIN can only be used a limited number of times. Keep it secure.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}