import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Key, BookOpen, Loader2 } from "lucide-react";

interface TeacherTokenPayload {
  token: string;
  teacher_name: string;
  term_id: string;
  assignments: any[];
  is_used: boolean;
}

const fetchPortalFormData = async () => {
  const client = supabase as any;
  
  // LOG: This helps you verify the new code is running in the browser
  console.log("System: Fetching fresh database records...");

  const [cls, sub, trm, sess] = await Promise.all([
    client.from('classes').select('*'),
    client.from('subjects').select('*'),
    client.from('terms').select('*'), // STRICTLY NO .eq() FILTERS HERE
    client.from('sessions').select('*')
  ]);
  
  const formattedTerms = (trm.data || []).map((t: any) => {
    const session = (sess.data || []).find((s: any) => s.id === t.session_id);
    const termLabel = t.term_type ? t.term_type.replace('_', ' ') : "Unknown Term";
    const sessionLabel = session ? `(${session.name})` : "";
    
    return {
      ...t,
      display_name: `${termLabel} ${sessionLabel}`.trim()
    };
  });
  
  return { 
    classes: cls.data || [], 
    subjects: sub.data || [], 
    terms: formattedTerms 
  };
};

export function TokenGenerator() {
  const [teacherName, setTeacherName] = useState("");
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPortalFormData();
        setClasses(data.classes);
        setSubjects(data.subjects);
        setTerms(data.terms);
      } catch (error) {
        console.error("Critical: Data load failed", error);
      }
    };
    loadData();
  }, []);

  const addAssignmentToList = () => {
    if (!selectedClass || !selectedSubject) {
      toast({ 
        title: "Selection Required", 
        description: "Pick a class and a subject first.", 
        variant: "destructive" 
      });
      return;
    }

    const classData = classes.find(c => c.id === selectedClass);
    const subjectData = subjects.find(s => s.id === selectedSubject);
    const isDuplicate = assignments.find(a => a.class_id === selectedClass && a.subject_id === selectedSubject);
    
    if (isDuplicate) {
      toast({ 
        title: "Already Added", 
        description: "This pair is already in the list.", 
        variant: "destructive" 
      });
      return;
    }

    setAssignments([...assignments, {
      class_id: selectedClass,
      class_name: classData?.level || classData?.name,
      subject_id: selectedSubject,
      subject_name: subjectData?.name
    }]);

    setSelectedClass("");
    setSelectedSubject("");
  };

  const removeAssignmentFromList = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const generateToken = async () => {
    if (!teacherName || !selectedTerm || assignments.length === 0) {
      toast({ 
        title: "Missing Info", 
        description: "Please complete all steps.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase();

    const payload: TeacherTokenPayload = {
      token: newToken,
      teacher_name: teacherName,
      term_id: selectedTerm,
      assignments: assignments,
      is_used: false
    };

    const { error } = await (supabase.from('teacher_tokens') as any).insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Token Generated", 
        description: `Token ${newToken} assigned to ${teacherName}.` 
      });
      setTeacherName("");
      setAssignments([]);
      setSelectedTerm("");
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 font-bold">1. Setup Token</CardTitle>
          <CardDescription>Assign teacher name and academic term</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher's Name</Label>
            <Input 
                value={teacherName} 
                onChange={(e) => setTeacherName(e.target.value)} 
                placeholder="e.g. Mr. Musa" 
            />
          </div>

          <div className="space-y-2">
            <Label>Academic Term</Label>
            <Select onValueChange={setSelectedTerm} value={selectedTerm}>
              <SelectTrigger>
                <SelectValue placeholder={terms.length > 0 ? "Select Term" : "No terms found"} />
              </SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.display_name} {t.is_current && " (Active)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t space-y-4">
            <Label className="font-bold text-blue-600 uppercase text-xs">2. Add Class & Subject Pairs</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full border-blue-200 text-blue-700" onClick={addAssignmentToList}>
              <Plus className="h-4 w-4 mr-2" /> Add Assignment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 border-dashed border-2 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Assignment Summary</span>
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{assignments.length}</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="min-h-[200px] space-y-2">
            {assignments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground italic text-sm">
                Add at least one pair to generate a token
              </div>
            )}
            {assignments.map((asgn, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border shadow-sm border-blue-100">
                <div>
                  <p className="font-bold text-sm">{asgn.class_name}</p>
                  <p className="text-[10px] uppercase text-slate-500">{asgn.subject_name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAssignmentFromList(idx)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          <Button 
            className="mt-auto w-full bg-blue-700 hover:bg-blue-800 h-12" 
            onClick={generateToken} 
            disabled={isSaving || assignments.length === 0}
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Key className="mr-2 h-4 w-4" />}
            Generate Teacher Token
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}