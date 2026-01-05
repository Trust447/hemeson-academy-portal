import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Check, Loader2, Send, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define a strict type for the token data to fix the 'any' issues
interface TokenData {
  token: string;
  class_id: string;
  subject_id: string;
  term_id: string;
  class_info?: { level: string };
  subject_info?: { name: string };
  student_list: Array<{
    id: string;
    full_name: string;
  }>;
}

const scoreEntrySchema = z.object({
  scores: z.array(z.object({
    student_id: z.string(),
    student_name: z.string(),
    ca1: z.number().min(0).max(20).nullable().default(0),
    ca2: z.number().min(0).max(20).nullable().default(0),
    exam: z.number().min(0).max(60).nullable().default(0),
    teacher_comment: z.string().max(500).optional(),
  }))
});

type ScoreEntryFormValues = z.infer<typeof scoreEntrySchema>;

export default function ScoreEntry() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, watch, reset } = useForm<ScoreEntryFormValues>({
    resolver: zodResolver(scoreEntrySchema),
    defaultValues: { scores: [] }
  });

  const watchedScores = watch("scores");

  useEffect(() => {
    const storedData = sessionStorage.getItem('teacherTokenData');
    if (!storedData) {
      toast({ title: "Session Expired", description: "Please enter your token again.", variant: "destructive" });
      navigate('/teacher');
      return;
    }

    try {
      const data = JSON.parse(storedData) as TokenData;
      setTokenData(data);

      if (data.student_list) {
        const initialScores = data.student_list.map((student) => ({
          student_id: student.id,
          student_name: student.full_name,
          ca1: 0,
          ca2: 0,
          exam: 0,
          teacher_comment: ''
        }));
        reset({ scores: initialScores });
      }
    } catch (err) {
      navigate('/teacher');
    }
  }, [navigate, toast, reset]);

  const calculateGrade = (total: number): string => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const confirmSubmit = async () => {
    if (!tokenData) return;
    setIsSubmitting(true);

    try {
      // 1. Prepare data matching the 'scores' table Row/Insert type
      const scoresToInsert = watchedScores.map(score => {
        const ca1 = score.ca1 || 0;
        const ca2 = score.ca2 || 0;
        const exam = score.exam || 0;
        const total = ca1 + ca2 + exam;

        return {
          student_id: score.student_id,
          subject_id: tokenData.subject_id,
          class_id: tokenData.class_id,
          term_id: tokenData.term_id, // Mandatory field fixed
          ca1,
          ca2,
          exam,
          total,
          grade: calculateGrade(total),
          teacher_comment: score.teacher_comment || ""
        };
      });

      // 2. Insert into the CORRECT table 'scores'
      const { error: insertError } = await supabase
        .from('scores') 
        .insert(scoresToInsert);

      if (insertError) throw insertError;

      // 3. Mark token as used
      await supabase
        .from('teacher_tokens')
        .update({ is_used: true })
        .eq('token', tokenData.token);

      sessionStorage.removeItem('teacherTokenData');
      toast({ title: "Success", description: "Scores have been recorded." });
      navigate('/teacher/success');

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (!tokenData) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Score Entry Sheet</CardTitle>
              <CardDescription className="flex gap-2 mt-1">
                <Badge variant="secondary">{tokenData.class_info?.level}</Badge>
                <Badge variant="secondary">{tokenData.subject_info?.name}</Badge>
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Students</p>
              <p className="text-xl font-bold">{tokenData.student_list?.length}</p>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-24 text-center">CA1 (20)</TableHead>
                <TableHead className="w-24 text-center">CA2 (20)</TableHead>
                <TableHead className="w-24 text-center">Exam (60)</TableHead>
                <TableHead className="w-20 text-center">Total</TableHead>
                <TableHead className="w-20 text-center">Grade</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchedScores.map((score, index) => {
                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                return (
                  <TableRow key={score.student_id}>
                    <TableCell className="text-center text-slate-400">{index + 1}</TableCell>
                    <TableCell className="font-medium">{score.student_name}</TableCell>
                    <TableCell><Input type="number" {...register(`scores.${index}.ca1`, { valueAsNumber: true })} className="text-center" /></TableCell>
                    <TableCell><Input type="number" {...register(`scores.${index}.ca2`, { valueAsNumber: true })} className="text-center" /></TableCell>
                    <TableCell><Input type="number" {...register(`scores.${index}.exam`, { valueAsNumber: true })} className="text-center" /></TableCell>
                    <TableCell className="text-center font-bold text-blue-600">{total}</TableCell>
                    <TableCell className="text-center"><Badge>{calculateGrade(total)}</Badge></TableCell>
                    <TableCell><Textarea {...register(`scores.${index}.teacher_comment`)} className="min-h-[38px] resize-none py-1" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate('/teacher')}>Cancel</Button>
            <Button onClick={() => setShowConfirmDialog(true)}>Submit Scores</Button>
          </div>
        </Card>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will lock scores and expire your token.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-blue-600">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}