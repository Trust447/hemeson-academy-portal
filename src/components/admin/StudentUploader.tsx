import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

// Reaching into the real Database type for the classes table row
type ClassRow = Database['public']['Tables']['classes']['Row'];

export function StudentUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadMetadata() {
      // Get the currently active session UUID
      const { data: session } = await supabase.from('sessions').select('id').eq('is_current', true).maybeSingle();
      // Get all classes to map names (e.g., 'JSS1') to IDs (UUIDs)
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
      toast({ title: "Error", description: "No active session found. Set a session first.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Split rows and filter out empty lines
        const rows = text.split('\n').filter(row => row.trim() !== '');
        // Extract headers and sanitize them
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        const studentsToInsert = dataRows.map(row => {
          const values = row.split(',').map(v => v.trim());
          const getVal = (name: string) => values[headers.indexOf(name)];

          // Match the 'class' column in CSV (e.g., 'JSS1') to the 'level' in DB
          const csvClassLevel = getVal('class');
          const targetClass = classes.find(c => c.level === csvClassLevel);

          return {
            admission_number: getVal('admission_number'),
            first_name: getVal('first_name'),
            last_name: getVal('last_name'),
            middle_name: getVal('middle_name') || null,
            gender: getVal('gender') || null,
            class_id: targetClass?.id || null, // Map text to UUID
            session_id: sessionId,
            is_active: true
          };
        }).filter(s => s.admission_number && s.first_name);

        const { error } = await supabase.from('students').insert(studentsToInsert);

        if (error) throw error;

        toast({ title: "Success", description: `Successfully enrolled ${studentsToInsert.length} students.` });
        onUploadSuccess(); // Refresh the list in the other tab
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error: any) {
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card className="border-dashed border-2 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
        <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-semibold">Bulk Student Enrollment</h3>
          <p className="text-sm text-muted-foreground">Upload CSV with columns: admission_number, first_name, last_name, middle_name, gender, class</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
          {isUploading ? "Uploading..." : "Select CSV File"}
        </Button>
      </CardContent>
    </Card>
  );
}