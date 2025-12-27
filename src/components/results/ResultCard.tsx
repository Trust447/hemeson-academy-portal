import { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, GraduationCap, User, Calendar, BookOpen } from "lucide-react";

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

interface ResultCardProps {
  data: ResultData;
  onBack: () => void;
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

function formatTermType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Term';
}

export default function ResultCard({ data, onBack }: ResultCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalMarks = data.scores.reduce((sum, s) => sum + (s.total || 0), 0);
  const possibleTotal = data.scores.length * 100;
  const average = data.scores.length > 0 ? (totalMarks / data.scores.length).toFixed(1) : '0.0';

  // Calculate overall grade
  const avgNum = parseFloat(average);
  let overallGrade = 'F';
  if (avgNum >= 70) overallGrade = 'A';
  else if (avgNum >= 60) overallGrade = 'B';
  else if (avgNum >= 50) overallGrade = 'C';
  else if (avgNum >= 45) overallGrade = 'D';
  else if (avgNum >= 40) overallGrade = 'E';

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 lg:p-6">
      {/* Action Bar - Hidden in print */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data.usage.remaining} view(s) remaining
          </span>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Result
          </Button>
        </div>
      </div>

      {/* Result Card - Printable */}
      <div ref={printRef} className="max-w-4xl mx-auto print:max-w-none">
        <Card className="border-2 print:border print:shadow-none">
          {/* Header */}
          <CardHeader className="text-center border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center print:bg-primary">
                <GraduationCap className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-display text-primary">
              HEMESON ACADEMY
            </h1>
            <p className="text-muted-foreground">Excellence in Education</p>
            <Separator className="my-4" />
            <h2 className="text-xl font-semibold">
              STUDENT RESULT CARD
            </h2>
            <p className="text-muted-foreground">
              {formatTermType(data.term.type)} - {data.term.session?.name || 'Current Session'}
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-semibold">
                    {data.student.last_name} {data.student.first_name} {data.student.middle_name || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-semibold">
                    {data.student.class?.level} {data.student.class?.section || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Admission Number</p>
                  <p className="font-semibold font-mono">{data.student.admission_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                  <Badge className={`${getGradeColor(overallGrade)} text-lg px-3`}>
                    {overallGrade} ({average}%)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scores Table */}
            {data.scores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No scores available for this term.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center w-16">CA1 (20)</TableHead>
                      <TableHead className="text-center w-16">CA2 (20)</TableHead>
                      <TableHead className="text-center w-16">Exam (60)</TableHead>
                      <TableHead className="text-center w-16">Total (100)</TableHead>
                      <TableHead className="text-center w-16">Grade</TableHead>
                      <TableHead className="hidden md:table-cell">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.scores.map((score, index) => (
                      <TableRow key={score.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {score.subjects?.name || 'Unknown Subject'}
                        </TableCell>
                        <TableCell className="text-center">{score.ca1?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">{score.ca2?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">{score.exam?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center font-semibold">{score.total?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getGradeColor(score.grade || 'F')}>
                            {score.grade || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {score.teacher_comment || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Subjects</p>
                <p className="text-2xl font-bold">{data.scores.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-2xl font-bold">{totalMarks.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Possible Total</p>
                <p className="text-2xl font-bold">{possibleTotal}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-bold">{average}%</p>
              </div>
            </div>

            {/* Grade Key */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Grading System</h3>
              <div className="flex flex-wrap gap-3">
                <Badge className={getGradeColor('A')}>A: 70-100 (Excellent)</Badge>
                <Badge className={getGradeColor('B')}>B: 60-69 (Very Good)</Badge>
                <Badge className={getGradeColor('C')}>C: 50-59 (Good)</Badge>
                <Badge className={getGradeColor('D')}>D: 45-49 (Pass)</Badge>
                <Badge className={getGradeColor('E')}>E: 40-44 (Fair)</Badge>
                <Badge className={getGradeColor('F')}>F: 0-39 (Fail)</Badge>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t print:mt-8">
              <p>This is a computer-generated result card.</p>
              <p>Generated on {new Date().toLocaleDateString('en-NG', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root {
            visibility: visible;
          }
          [ref="printRef"], [ref="printRef"] * {
            visibility: visible;
          }
        }
      `}</style>
    </div>
  );
}