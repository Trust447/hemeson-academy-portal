import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Check, Loader2, AlertTriangle, Send } from "lucide-react";
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

const scoreEntrySchema = z.object({
  scores: z.array(z.object({
    student_id: z.string(),
    student_name: z.string(),
    ca1: z.number().min(0).max(20).nullable(),
    ca2: z.number().min(0).max(20).nullable(),
    exam: z.number().min(0).max(60).nullable(),
    teacher_comment: z.string().max(500).optional(),
  }))
});

type ScoreEntry = z.infer<typeof scoreEntrySchema>;

interface TokenData {
  token: string;
  id: string;
  class_id: string;
  subject_id: string;
  class: { level: string; section: string; session_id: string };
  subject: { id: string; name: string; code: string };
  current_term: { id: string; term_type: string; session_id: string };
  students: Array<{
    id: string;
    admission_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
  }>;
}

function calculateGrade(total: number): string {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-800 border-green-200';
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'E': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-red-200 text-red-900 border-red-300';
  }
}

export default function ScoreEntry() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ScoreEntry>({
    resolver: zodResolver(scoreEntrySchema),
    defaultValues: {
      scores: []
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "scores"
  });

  const watchedScores = watch("scores");

  useEffect(() => {
    const storedData = sessionStorage.getItem('teacherTokenData');
    if (!storedData) {
      toast({
        title: "Session Expired",
        description: "Please enter your token again.",
        variant: "destructive",
      });
      navigate('/teacher');
      return;
    }

    try {
      const data = JSON.parse(storedData) as TokenData;
      setTokenData(data);

      // Initialize form with students
      if (data.students && data.students.length > 0) {
        const initialScores = data.students.map(student => ({
          student_id: student.id,
          student_name: `${student.last_name} ${student.first_name} ${student.middle_name || ''}`.trim(),
          ca1: null as number | null,
          ca2: null as number | null,
          exam: null as number | null,
          teacher_comment: ''
        }));
        
        // Reset form with new values
        control._reset({ scores: initialScores });
      }
    } catch (err) {
      console.error('Failed to parse token data:', err);
      navigate('/teacher');
    }
  }, [navigate, toast, control]);

  const onSubmit = async (data: ScoreEntry) => {
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (!tokenData) return;
    
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      const scoresToSubmit = watchedScores.map(score => ({
        student_id: score.student_id,
        ca1: score.ca1,
        ca2: score.ca2,
        exam: score.exam,
        teacher_comment: score.teacher_comment
      }));

      const { data, error } = await supabase.functions.invoke('submit-scores', {
        body: {
          token: tokenData.token,
          term_id: tokenData.current_term?.id,
          class_id: tokenData.class_id,
          subject_id: tokenData.subject_id,
          scores: scoresToSubmit
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Clear session storage
      sessionStorage.removeItem('teacherTokenData');

      toast({
        title: "Scores Submitted!",
        description: `Successfully saved ${data.saved} student scores. Your token has been expired.`,
      });

      // Navigate to success page
      navigate('/teacher/success');

    } catch (err: any) {
      console.error('Submission error:', err);
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Score Entry</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{tokenData.class?.level}</Badge>
                    <Badge variant="outline">{tokenData.subject?.name}</Badge>
                    <Badge variant="secondary">{tokenData.current_term?.term_type} Term</Badge>
                  </CardDescription>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{tokenData.students?.length || 0} Students</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Score Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Enter Scores</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>CA1: 0-20</span>
                <span>CA2: 0-20</span>
                <span>Exam: 0-60</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {tokenData.students?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p>No students found for this class.</p>
                <p className="text-sm">Please contact the admin.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[200px]">Student Name</TableHead>
                        <TableHead className="w-20 text-center">CA1 (20)</TableHead>
                        <TableHead className="w-20 text-center">CA2 (20)</TableHead>
                        <TableHead className="w-20 text-center">Exam (60)</TableHead>
                        <TableHead className="w-20 text-center">Total</TableHead>
                        <TableHead className="w-16 text-center">Grade</TableHead>
                        <TableHead className="min-w-[150px]">Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokenData.students?.map((student, index) => {
                        const ca1 = watchedScores[index]?.ca1 || 0;
                        const ca2 = watchedScores[index]?.ca2 || 0;
                        const exam = watchedScores[index]?.exam || 0;
                        const total = ca1 + ca2 + exam;
                        const grade = calculateGrade(total);

                        return (
                          <TableRow key={student.id}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {student.last_name} {student.first_name} {student.middle_name || ''}
                              <input type="hidden" {...register(`scores.${index}.student_id`)} value={student.id} />
                              <input type="hidden" {...register(`scores.${index}.student_name`)} value={`${student.last_name} ${student.first_name}`} />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                step={0.5}
                                placeholder="0"
                                className="w-16 text-center"
                                {...register(`scores.${index}.ca1`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={20}
                                step={0.5}
                                placeholder="0"
                                className="w-16 text-center"
                                {...register(`scores.${index}.ca2`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={60}
                                step={0.5}
                                placeholder="0"
                                className="w-16 text-center"
                                {...register(`scores.${index}.exam`, { valueAsNumber: true })}
                              />
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {total.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={getGradeColor(grade)}>{grade}</Badge>
                            </TableCell>
                            <TableCell>
                              <Textarea
                                placeholder="Optional comment..."
                                className="min-h-[40px] text-sm resize-none"
                                {...register(`scores.${index}.teacher_comment`)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-6 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      sessionStorage.removeItem('teacherTokenData');
                      navigate('/teacher');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit Scores
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Score Submission</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to submit these scores?</p>
              <p className="font-semibold text-destructive">
                ⚠️ This action cannot be undone. Your token will expire after submission.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              <Check className="mr-2 h-4 w-4" />
              Confirm Submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}