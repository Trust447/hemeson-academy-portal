import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type ClassRow = Database['public']['Tables']['classes']['Row'];

export function StudentUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMetadata() {
      // 1. Get current academic session
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();
      
      // 2. Get classes for UUID mapping
      const { data: classList } = await supabase.from('classes').select('*');
      
      if (session) setSessionId(session.id);
      if (classList) setClasses(classList);
    }
    loadMetadata();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!sessionId) {
      toast({ 
        title: "Missing Session", 
        description: "Please ensure an active session is set in Academic Settings.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        
        // Normalize headers to prevent "Header Not Found" errors
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const studentsToInsert = dataRows.map((row) => {
          const values = row.split(',').map(v => v.trim());
          const getVal = (name: string) => {
            const index = headers.indexOf(name);
            return index > -1 ? values[index] : null;
          };

          // Find the matching Class UUID
          const rawCsvClass = getVal('class') || "";
          const csvClassKey = rawCsvClass.toLowerCase().replace(/\s/g, '');
          
          const targetClass = classes.find(c => 
            c.level.toLowerCase().replace(/\s/g, '') === csvClassKey
          );

          // Return clean object for Supabase
          return {
            admission_number: getVal('admission_number'),
            first_name: getVal('first_name'),
            last_name: getVal('last_name'),
            middle_name: getVal('middle_name') || null,
            gender: getVal('gender') || null,
            // Critical UUID fix: send null if class not found
            class_id: targetClass?.id || null, 
            session_id: sessionId, 
            is_active: true
          };
        }).filter(s => s.admission_number && s.first_name);

        if (studentsToInsert.length === 0) {
          throw new Error("No valid student data found in the CSV file.");
        }

        // Validation: Ensure every student has a valid Class UUID
        const missingClasses = studentsToInsert.filter(s => !s.class_id);
        if (missingClasses.length > 0) {
          throw new Error(
            `${missingClasses.length} rows have class names that don't match your system. Check spelling of "${missingClasses[0].admission_number}'s" class.`
          );
        }

        // Perform the Bulk Insert
        const { error } = await supabase.from('students').insert(studentsToInsert);

        if (error) {
          // Check for Duplicate Admission Numbers
          if (error.code === '23505') {
            throw new Error("Duplicate Admission Number found. Some students in this CSV are already registered.");
          }
          throw error;
        }

        toast({ 
          title: "Success!", 
          description: `Successfully enrolled ${studentsToInsert.length} students.` 
        });
        
        onUploadSuccess(); 
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error: any) {
        toast({ 
          title: "Upload Failed", 
          description: error.message, 
          variant: "destructive" 
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileUpload} 
        />
        <FileSpreadsheet className="h-12 w-12 text-green-600 mb-4" />
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-semibold">Bulk Student Enrollment</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload a CSV file with the following column headers: <br />
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {['admission_number', 'first_name', 'last_name', 'middle_name', 'gender', 'class'].map(h => (
                <code key={h} className="bg-white border px-1.5 py-0.5 rounded text-[11px] text-blue-600 font-mono">
                  {h}
                </code>
              ))}
            </div>
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full max-w-xs">
          {isUploading ? (
            <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Enrolling Students...</>
          ) : (
            <><Upload className="mr-2 h-4 w-4" /> Select CSV File</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}