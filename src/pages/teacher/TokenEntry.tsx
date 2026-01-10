import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {  BookOpen, ChevronRight, Loader2, LogOut } from "lucide-react";
import ScoreEntrySheet from "./ScoreEntrySheet"; 
import { Link } from "react-router-dom";

export default function TeacherTokenEntry() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('teacher_tokens')
      .select('*')
      .eq('token', token.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      alert("Invalid Token. Access denied.");
      setIsLoading(false);
      return;
    }
    setTeacherData(data);
    setIsLoading(false);
  };

  // 1. IF A CLASS IS SELECTED: Show the Score Sheet
  if (selectedAssignment) {
    return (
      <ScoreEntrySheet 
        teacherName={teacherData.teacher_name}
        classId={selectedAssignment.class_id}
        className={selectedAssignment.class_name}
        subjectId={selectedAssignment.subject_id}
        subjectName={selectedAssignment.subject_name}
        termId={teacherData.term_id}
        onBack={() => setSelectedAssignment(null)}
      />
    );
  }

  // 2. IF LOGGED IN BUT NO CLASS SELECTED: Show Subject List
  if (teacherData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-blue-600 rounded-lg p-8 text-white flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Welcome, {teacherData.teacher_name}</h1>
            <p className="opacity-90">Select a subject to manage scores for this term.</p>
          </div>
          <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" onClick={() => setTeacherData(null)}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {teacherData.assignments?.map((asgn: any, i: number) => (
            <Card key={i} className="hover:border-blue-500 cursor-pointer transition-all shadow-sm group border-2" 
                  onClick={() => setSelectedAssignment(asgn)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{asgn.class_name}</h3>
                    <p className="text-muted-foreground">{asgn.subject_name}</p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 3. DEFAULT: Show Token Login Screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-blue-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Link to="/" className="group">
                        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border shadow-sm">
                          <img 
                            src="/hemeson-logo.png" 
                            alt="Hemeson Academy Logo" 
                            className="w-16 h-16 object-contain" 
                          />
                        </div>
                      </Link>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Staff Portal Access</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your secure token to record scores</p>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <Input 
              id="token"
              placeholder="E.G. xxxxx" 
              className="text-center font-mono uppercase text-xl h-14 tracking-[0.2em]"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700" onClick={handleLogin} disabled={isLoading || !token}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify Identity"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}