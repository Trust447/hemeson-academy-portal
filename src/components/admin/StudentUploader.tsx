import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Client-side validation schema (same as server-side for UX)
const studentSchema = z.object({
  admission_number: z.string()
    .min(1, "Admission number is required")
    .max(50, "Admission number too long")
    .regex(/^[A-Za-z0-9/\-]+$/, "Admission number contains invalid characters"),
  first_name: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name too long"),
  last_name: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name too long"),
  middle_name: z.string().max(100).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  class: z.enum(["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"]),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

interface ParsedStudent {
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender?: string;
  class: string;
  date_of_birth?: string;
  status: 'valid' | 'error';
  error?: string;
}

const sampleCSVData = `admission_number,first_name,last_name,middle_name,gender,class
HMA/2025/001,Adaora,Nwachukwu,Chioma,Female,JSS1
HMA/2025/002,Babatunde,Olatunji,Femi,Male,JSS1
HMA/2025/003,Chiamaka,Eze,,Female,JSS2
HMA/2025/004,Daniel,Adeyemi,Oluwaseun,Male,SSS1
HMA/2025/005,Esther,Ibrahim,Fatima,Female,SSS2`;

export function StudentUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch current session on mount
  useState(() => {
    const fetchCurrentSession = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();
      if (data) {
        setSessionId(data.id);
      }
    };
    fetchCurrentSession();
  });

  const sanitizeString = (str: string): string => {
    return str.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, 100);
  };

  const parseCSV = (content: string): ParsedStudent[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => sanitizeString(v));
      const rawStudent = {
        admission_number: values[headers.indexOf('admission_number')] || '',
        first_name: values[headers.indexOf('first_name')] || '',
        last_name: values[headers.indexOf('last_name')] || '',
        middle_name: values[headers.indexOf('middle_name')] || undefined,
        gender: values[headers.indexOf('gender')] || undefined,
        class: values[headers.indexOf('class')] || '',
        date_of_birth: values[headers.indexOf('date_of_birth')] || undefined,
      };

      // Validate using zod
      const result = studentSchema.safeParse(rawStudent);
      
      if (result.success) {
        return {
          ...rawStudent,
          status: 'valid' as const,
        };
      } else {
        const firstError = result.error.errors[0];
        return {
          ...rawStudent,
          status: 'error' as const,
          error: firstError?.message || 'Validation failed',
        };
      }
    });
  };

  const handleFile = (file: File) => {
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a CSV file smaller than 1MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const students = parseCSV(content);
      
      // Limit to 100 students per upload
      if (students.length > 100) {
        toast({
          title: "Too Many Students",
          description: "Please upload no more than 100 students at a time.",
          variant: "destructive",
        });
        setParsedStudents(students.slice(0, 100));
        return;
      }
      
      setParsedStudents(students);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = async () => {
    const validStudents = parsedStudents.filter(s => s.status === 'valid');
    if (validStudents.length === 0) {
      toast({
        title: "No Valid Students",
        description: "Please fix the errors before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: "No Active Session",
        description: "Please set a current session before uploading students.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload students.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      setUploadProgress(30);

      // Prepare students for server-side validation
      const studentsToUpload = validStudents.map(s => ({
        admission_number: s.admission_number,
        first_name: s.first_name,
        last_name: s.last_name,
        middle_name: s.middle_name,
        gender: s.gender,
        class_level: s.class,
        date_of_birth: s.date_of_birth,
        session_id: sessionId,
      }));

      setUploadProgress(50);

      // Call edge function for server-side validation and insert
      const { data, error } = await supabase.functions.invoke('bulk-upload-students', {
        body: { students: studentsToUpload }
      });

      setUploadProgress(90);

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload students.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Validation Error",
          description: data.details?.[0] || data.error,
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(100);
      
      toast({
        title: "Upload Complete",
        description: `${data.inserted} students have been added successfully.`,
      });

      setParsedStudents([]);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSVData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    const students = parseCSV(sampleCSVData);
    setParsedStudents(students);
    toast({
      title: "Sample Data Loaded",
      description: "Preview the sample data below before uploading.",
    });
  };

  const validCount = parsedStudents.filter(s => s.status === 'valid').length;
  const errorCount = parsedStudents.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Student Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file to add multiple students at once (max 100 students, 1MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports CSV files with student information
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="secondary" onClick={loadSampleData}>
              <Users className="h-4 w-4 mr-2" />
              Load Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {parsedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({parsedStudents.length} students)</CardTitle>
                <CardDescription className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-success">
                    <Check className="h-4 w-4" /> {validCount} valid
                  </span>
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" /> {errorCount} errors
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || validCount === 0}
              >
                {isUploading ? 'Uploading...' : 'Upload Students'}
              </Button>
            </div>
            {isUploading && (
              <Progress value={uploadProgress} className="mt-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStudents.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {student.admission_number}
                      </TableCell>
                      <TableCell>
                        {student.first_name} {student.middle_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.gender || '-'}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        {student.status === 'valid' ? (
                          <Badge className="bg-success/10 text-success border-success/20">
                            <Check className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {student.error}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
