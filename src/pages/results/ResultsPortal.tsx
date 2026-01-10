import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Loader2, AlertCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import ResultCard from "@/components/results/ResultCard";
import { Link } from "react-router-dom";

const pinSchema = z.object({
  admission_number: z.string().min(1, "Admission number is required"),
  pin: z.string().min(4, "PIN must be at least 4 characters")
});

export default function ResultsPortal() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageExceeded, setUsageExceeded] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsageExceeded(false);

    const validation = pinSchema.safeParse({
      admission_number: admissionNumber.trim(),
      pin: pin.trim()
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data: term, error: termErr } = await (supabase
        .from('terms')
        .select('id, term_type, is_current, sessions(name)')
        .eq('is_current', true)
        .maybeSingle() as any);

      if (termErr || !term) {
        throw new Error("No active academic term found.");
      }

      const { data: pinRecord, error: pinErr } = await (supabase
        .from('result_pins')
        .select(`
          id,
          pin_code,
          usage_count,
          max_uses,
          student:students!inner(
            id,
            admission_number,
            first_name,
            last_name,
            middle_name,
            classes(level)
          )
        `) as any)
        .eq('pin_code', pin.trim())
        .eq('student.admission_number', admissionNumber.trim().toUpperCase())
        .eq('term_id', term.id)
        .maybeSingle();

      if (pinErr || !pinRecord) {
        setError("Invalid Admission Number or PIN for this term.");
        return;
      }

      const { data: scores, error: scoresErr } = await (supabase
        .from('scores') 
        .select(`
          id,
          ca1,
          ca2,
          exam,
          total,
          grade,
          subjects(id, name, code)
        `) as any)
        .eq('student_id', pinRecord.student.id)
        .eq('term_id', term.id);

      if (scoresErr) throw new Error("Could not retrieve score records.");

      await supabase
        .from('result_pins')
        .update({ usage_count: (pinRecord.usage_count || 0) + 1 })
        .eq('id', pinRecord.id);

      const finalResult = {
        student: {
          ...pinRecord.student,
          class: { level: pinRecord.student.classes?.level || "N/A" }
        },
        term: {
          id: term.id,
          type: term.term_type || "Current Term", 
          session: { name: term.sessions?.name || "Current Session" }
        },
        scores: scores || [],
        usage: {
          count: (pinRecord.usage_count || 0) + 1,
          max: 999,
          remaining: 999
        }
      };

      setResultData(finalResult);
      toast({ title: "Results Loaded", description: "Successfully retrieved academic records." });

    } catch (err: any) {
      console.error('Portal Error:', err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (resultData) {
    return <ResultCard data={resultData} onBack={() => setResultData(null)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-blue-600">
        <CardHeader className="text-center">
          <div className="rounded-full flex items-center justify-center">
            <Link to="/" className="group">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border shadow-sm">
                <img src="/hemeson-logo.png" alt="Logo" className="w-16 h-16 object-contain" />
              </div>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Student Portal Access</CardTitle>
          <CardDescription>Enter details to view your result</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admission">Admission Number</Label>
              <Input
                id="admission"
                placeholder="HMA/2025/001"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Result PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 font-mono"
                />
              </div>
            </div>

            {error && !usageExceeded && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {usageExceeded && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-amber-700 font-medium">
                  <AlertCircle className="h-5 w-5" />
                  PIN Usage Limit Reached
                </div>
                <p className="text-sm text-amber-600">
                  This PIN has been used the maximum allowed times.
                </p>
                <Button variant="outline" className="w-full border-amber-200" asChild>
                  <a href="tel:+2341234567890"><Phone className="mr-2 h-4 w-4" /> Contact Admin</a>
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={isLoading || !admissionNumber || !pin}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Check Result"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}