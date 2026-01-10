import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface Props {
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  termId: string;
  onBack: () => void;
}

export default function ScoreEntry({ teacherName, classId, className, subjectId, subjectName, termId, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, watch, reset } = useForm<ScoreEntryFormValues>({
    resolver: zodResolver(scoreEntrySchema),
    defaultValues: { scores: [] }
  });

  const watchedScores = watch("scores");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: students } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('class_id', classId)
          .order('last_name');

        const { data: existingScores } = await supabase
          .from('scores')
          .select('*')
          .eq('subject_id', subjectId)
          .eq('term_id', termId);

        const scoreMap = new Map(existingScores?.map(s => [s.student_id, s]));

        if (students) {
          const initialScores = students.map((student) => {
            const existing = scoreMap.get(student.id);
            return {
              student_id: student.id,
              student_name: `${student.last_name} ${student.first_name}`,
              ca1: existing?.ca1 ?? 0,
              ca2: existing?.ca2 ?? 0,
              exam: existing?.exam ?? 0,
              teacher_comment: existing?.teacher_comment ?? ''
            };
          });
          reset({ scores: initialScores });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [classId, subjectId, termId, reset]);

  const calculateGrade = (total: number): string => {
    if (total >= 70) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
  };

  const onSave = async (data: ScoreEntryFormValues) => {
    setIsSubmitting(true);
    try {
      const scoresToUpsert = data.scores.map(score => {
        /**
         * NOTE: We do NOT send 'total' or 'grade' to Supabase.
         * These are 'GENERATED' columns in the database. Sending values manually
         * causes "cannot insert a non-default value" error.
         */
        return {
          student_id: score.student_id,
          subject_id: subjectId,
          class_id: classId,
          term_id: termId,
          ca1: score.ca1 || 0,
          ca2: score.ca2 || 0,
          exam: score.exam || 0,
          teacher_comment: score.teacher_comment || "",
          submitted_by: teacherName 
        };
      });

      const { error } = await (supabase
        .from('scores')
        .upsert(scoresToUpsert, { onConflict: 'student_id, subject_id, term_id' }) as any);

      if (error) throw error;

      toast({ title: "Progress Saved", description: `Scores for ${className} updated successfully.` });
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-2xl font-bold">{className} - {subjectName}</h2>
            <p className="text-sm text-muted-foreground">Teacher: <span className="font-semibold text-blue-600">{teacherName}</span></p>
          </div>
        </div>
        <Button onClick={handleSubmit(onSave)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Scores
        </Button>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-24 text-center">CA1 (20)</TableHead>
              <TableHead className="w-24 text-center">CA2 (20)</TableHead>
              <TableHead className="w-24 text-center">Exam (60)</TableHead>
              <TableHead className="w-20 text-center font-bold">Total</TableHead>
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
                  <TableCell className="text-center"><Badge variant={total < 40 ? "destructive" : "secondary"}>{calculateGrade(total)}</Badge></TableCell>
                  <TableCell><Textarea {...register(`scores.${index}.teacher_comment`)} className="min-h-[38px] resize-none py-1" /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}