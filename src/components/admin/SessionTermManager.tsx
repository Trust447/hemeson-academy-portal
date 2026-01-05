import { useState, useEffect } from "react";
import { Calendar, Check, Plus, Loader2, ArrowUpCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const getTermLabel = (type: string) => {
  const labels: Record<string, string> = {
    'first': 'First Term',
    'second': 'Second Term',
    'third': 'Third Term'
  };
  return labels[type] || type;
};

export function SessionTermManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionYear, setNewSessionYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const currentSession = sessions.find(s => s.is_current);
  const currentTerm = terms.find(t => t.is_current);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.from('sessions').select('*').order('start_year', { ascending: false });
      const { data: termData } = await supabase.from('terms').select('*');
      const { data: classData } = await supabase.from('classes').select('*').order('level', { ascending: true });
      
      if (sessionData) setSessions(sessionData);
      if (termData) setTerms(termData);
      if (classData) setClasses(classData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- NEW: PROMOTION LOGIC ---
  const handleBulkPromotion = async () => {
    setIsPromoting(true);
    try {
      // We promote from the bottom up (e.g., SS2 to SS3 first) to avoid mixing students
      // We assume your classes are ordered by level in the database
      for (let i = classes.length - 2; i >= 0; i--) {
        const currentClass = classes[i];
        const nextClass = classes[i + 1];

        const { error } = await supabase
          .from('students')
          .update({ class_id: nextClass.id })
          .eq('class_id', currentClass.id);
        
        if (error) throw error;
      }

      toast({ 
        title: "Promotion Successful", 
        description: "All students have been moved to the next academic level." 
      });
      fetchData();
    } catch (err: any) {
      toast({ title: "Promotion Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleSetCurrentSession = async (sessionId: string) => {
    try {
      await supabase.from('sessions').update({ is_current: false }).neq('id', sessionId);
      const { error } = await supabase.from('sessions').update({ is_current: true }).eq('id', sessionId);
      if (error) throw error;
      await fetchData();
      toast({ title: "Session Updated", description: "The active session has been changed." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSetCurrentTerm = async (termId: string) => {
    try {
      await supabase.from('terms').update({ is_current: false }).neq('id', termId);
      const { error } = await supabase.from('terms').update({ is_current: true }).eq('id', termId);
      if (error) throw error;
      await fetchData();
      toast({ title: "Term Updated", description: "The active term has been changed." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCreateSession = async () => {
    try {
      const sessionName = `${newSessionYear}/${newSessionYear + 1}`;
      const { data: newSession, error: sError } = await supabase
        .from('sessions')
        .insert([{ name: sessionName, start_year: newSessionYear, end_year: newSessionYear + 1, is_current: false }])
        .select().single();

      if (sError) throw sError;

      const termTypes = ['first', 'second', 'third'] as const;
      const termsToInsert = termTypes.map(type => ({
        session_id: newSession.id,
        term_type: type,
        is_current: false
      }));

      const { error: tError } = await supabase.from('terms').insert(termsToInsert);
      if (tError) throw tError;

      setIsCreateDialogOpen(false);
      await fetchData();
      toast({ title: "Session Created", description: `Academic session ${sessionName} created.` });
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    }
  };

  const sessionTerms = (sessionId: string) => terms.filter(t => t.session_id === sessionId);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Active Academic Period
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-12">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Active Session</p>
            <p className="text-3xl font-bold tracking-tight">{currentSession?.name || 'Not Set'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Active Term</p>
            <p className="text-3xl font-bold tracking-tight">{currentTerm ? getTermLabel(currentTerm.term_type) : 'Not Set'}</p>
          </div>
        </CardContent>
      </Card>

      {/* --- NEW: PROMOTION TOOL CARD --- */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Session Roll-over</p>
              <p className="text-xs text-amber-700">Promote all students to their next class level for the new session.</p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Promote Students
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 h-5 w-5" />
                  Confirm Mass Promotion
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will move <strong>EVERY</strong> student to the next class level. 
                  Please ensure you have manually graduated your final year students (e.g., SS3) by setting them to inactive first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkPromotion} className="bg-amber-600 hover:bg-amber-700">
                  Yes, Promote All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Academic History</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Academic Session</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Label>Starting Year</Label>
              <Input type="number" value={newSessionYear} onChange={(e) => setNewSessionYear(parseInt(e.target.value))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateSession}>Create Session</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.is_current ? 'ring-2 ring-primary shadow-md' : 'bg-slate-50/50'}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-bold">{session.name}</h4>
                  {session.is_current && <Badge>Active</Badge>}
                </div>
                {!session.is_current && (
                  <Button variant="outline" size="sm" onClick={() => handleSetCurrentSession(session.id)}>
                    <Check className="h-4 w-4 mr-2" /> Make Active
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {sessionTerms(session.id).map((term) => (
                  <Button
                    key={term.id}
                    variant={term.is_current ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleSetCurrentTerm(term.id)}
                  >
                    {getTermLabel(term.term_type)}
                    {term.is_current && <Check className="ml-2 h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}