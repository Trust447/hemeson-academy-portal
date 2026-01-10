import { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, GraduationCap, User, Calendar, BookOpen } from "lucide-react";
// @ts-ignore
import html2pdf from "html2pdf.js";

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

// Fallback logic to calculate grade if score.grade is missing from database
function calculateGrade(score: number): string {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 45) return 'D';
  if (score >= 40) return 'E';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade?.toUpperCase()) {
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
  const downloadRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const element = downloadRef.current;
    if (!element) return;

    const opt = {
      margin: 0.2,
      filename: `${data.student.last_name}_${data.student.first_name}_Result.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    } as const;

    html2pdf().set(opt).from(element).save();
  };

  const totalMarks = data.scores.reduce((sum, s) => sum + (s.total || 0), 0);
  const average = data.scores.length > 0 ? (totalMarks / data.scores.length).toFixed(1) : '0.0';
  const avgNum = parseFloat(average);
  
  // Overall Grade Calculation
  const overallGrade = calculateGrade(avgNum);

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 lg:p-6">
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Result Card Content */}
      <div ref={downloadRef} className="max-w-4xl mx-auto bg-white">
        <Card className="border-2 shadow-sm">
          <CardHeader className="text-center border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-center pt-8 gap-4 mb-2"> 
              <img src="/hemeson-logo.png" alt="Logo" className="h-26 w-24" />
              <div className="flex flex-col text-left">
                <h1 className="text-2xl font-bold font-display text-primary">HEMESON ACADEMY</h1>
                <p className="text-muted-foreground italic text-sm">Striving For Excellence......</p>
              </div>
            </div>
            <h2 className="text-xl font-bold font-display text-primary mt-2">Hemeson House</h2>
            <p className="text-muted-foreground text-sm px-4">Ukaegbu, Umuejiji, Mbutuoma, Osisioma L.G.A. Aba, Abia State.</p>
            <Separator className="my-4" />
            <h2 className="text-xl font-semibold">STUDENT RESULT SHEET</h2>
            <p className="text-muted-foreground">
              {formatTermType(data.term.type)} - {data.term.session?.name || 'Current Session'}
            </p>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Bio Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">Student Name:</p>
                  <p className="font-semibold">{data.student.last_name} {data.student.first_name} {data.student.middle_name || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">Class:</p>
                  <p className="font-semibold">{data.student.class?.level} {data.student.class?.section || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">Admission No:</p>
                  <p className="font-semibold font-mono">{data.student.admission_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">Overall Grade:</p>
                  <Badge className={`${getGradeColor(overallGrade)} text-lg px-3`}>
                    {overallGrade} ({average}%)
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scores Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center w-16">CA1</TableHead>
                    <TableHead className="text-center w-16">CA2</TableHead>
                    <TableHead className="text-center w-16">Exam</TableHead>
                    <TableHead className="text-center w-16">Total</TableHead>
                    <TableHead className="text-center w-16">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.scores.map((score, index) => {
                    // This line ensures the grade shows up even if it's missing in the database
                    const displayGrade = score.grade || calculateGrade(score.total || 0);
                    
                    return (
                      <TableRow key={score.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{score.subjects?.name || 'Subject'}</TableCell>
                        <TableCell className="text-center">{score.ca1?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">{score.ca2?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">{score.exam?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center font-semibold">{score.total?.toFixed(1) || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getGradeColor(displayGrade)}>
                            {displayGrade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Subjects</p>
                <p className="text-xl font-bold">{data.scores.length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Total Marks</p>
                <p className="text-xl font-bold">{totalMarks.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Average</p>
                <p className="text-xl font-bold">{average}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Grade</p>
                <p className="text-xl font-bold">{overallGrade}</p>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>This is a computer-generated result card.</p>
              <p>Generated on {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}