import { useState, useEffect } from "react";
import { Calendar, Check, Plus, Loader2, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ---------------- TYPES ----------------
type TermType = "first" | "second" | "third";

interface Session {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
}

interface Term {
  id: string;
  session_id: string;
  term_type: TermType;
  is_current: boolean;
}

interface Class {
  id: string;
  name: string;
  level_order: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  status: "active" | "graduated" | "inactive";
  graduated_at: string | null;
}

// ---------------- HELPERS ----------------
const getTermLabel = (type: TermType) => {
  const labels: Record<TermType, string> = {
    first: "First Term",
    second: "Second Term",
    third: "Third Term"
  };
  return labels[type];
};

// ---------------- COMPONENT ----------------
export function SessionTermManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionYear, setNewSessionYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const currentSession = sessions.find((s) => s.is_current);
  const currentTerm = terms.find((t) => t.is_current);
  
  // Logic to check if we should show 'Complete Session' vs 'Run Promotion'
  const isThirdTerm = currentTerm?.term_type === "third";

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("id, name, start_year, end_year, is_current")
        .order("start_year", { ascending: false });

      const { data: termData } = await supabase
        .from("terms")
        .select("id, session_id, term_type, is_current");

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id, level, level_order");
      
      if (classError) throw classError;

      if (sessionData) setSessions(sessionData as Session[]);
      if (termData) setTerms(termData as Term[]);

      if (classData) {
        const normalizedClasses: Class[] = (classData as any[]).map((c: any) => ({
          id: c.id,
          name: (c.level || "").replace(/\s+/g, ""),
          level_order: c.level_order ?? 0
        }));
        const sortedClasses = normalizedClasses.sort((a, b) => a.level_order - b.level_order);
        setClasses(sortedClasses);
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- SESSION COMPLETION & PROMOTION ----------------
  const handleSessionRollOver = async () => {
    if (!classes || classes.length < 2) return;
    setIsProcessing(true);

    try {
      if (isThirdTerm) {
        // Step 1: Find or Create the next session automatically
        const nextStartYear = (currentSession?.start_year || new Date().getFullYear()) + 1;
        const nextName = `${nextStartYear}/${nextStartYear + 1}`;
        
        let nextSession = sessions.find(s => s.name === nextName);

        if (!nextSession) {
          const { data: created, error: createError } = await supabase
            .from("sessions")
            .insert([{ name: nextName, start_year: nextStartYear, end_year: nextStartYear + 1, is_current: false }])
            .select().single();
          if (createError) throw createError;
          nextSession = created as Session;

          // Add terms for the new session
          await supabase.from("terms").insert([
            { session_id: nextSession.id, term_type: "first", is_current: false },
            { session_id: nextSession.id, term_type: "second", is_current: false },
            { session_id: nextSession.id, term_type: "third", is_current: false }
          ]);
        }

        // Step 2: Run the specialized roll-over RPC (if you created it) or manual updates
        // Here we use the promotion RPC and then swap the sessions
        const { error: promoError } = await (supabase.rpc as any)("promote_all_students");
        if (promoError) throw promoError;

        await supabase.from("sessions").update({ is_current: false }).neq("id", nextSession.id);
        await supabase.from("sessions").update({ is_current: true }).eq("id", nextSession.id);
        
        // Set first term of new session
        const { data: newTerms } = await supabase.from("terms").select("id").eq("session_id", nextSession.id).eq("term_type", "first").single();
        if (newTerms) {
          await supabase.from("terms").update({ is_current: false }).neq("id", newTerms.id);
          await supabase.from("terms").update({ is_current: true }).eq("id", newTerms.id);
        }

        toast({ title: "Session Completed", description: `Students promoted to ${nextName} session.` });
      } else {
        // Standard Mid-Year Promotion
        const { error: rpcError } = await (supabase.rpc as any)("promote_all_students");
        if (rpcError) throw rpcError;
        toast({ title: "Promotion Success", description: "Students moved to their next classes." });
      }

      await fetchData();
    } catch (err: any) {
      toast({ title: "Process Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------- SET CURRENT SESSION/TERM ----------------
  const handleSetCurrentSession = async (sessionId: string) => {
    try {
      await supabase.from("sessions").update({ is_current: false }).neq("id", sessionId);
      await supabase.from("sessions").update({ is_current: true }).eq("id", sessionId);
      fetchData();
      toast({ title: "Active Session Updated" });
    } catch (err) { console.error(err); }
  };

  const handleSetCurrentTerm = async (termId: string) => {
    try {
      await supabase.from("terms").update({ is_current: false }).neq("id", termId);
      await supabase.from("terms").update({ is_current: true }).eq("id", termId);
      fetchData();
      toast({ title: "Active Term Updated" });
    } catch (err) { console.error(err); }
  };

  // ---------------- CREATE SESSION ----------------
  const handleCreateSession = async () => {
    try {
      const { data: newSession, error: sError } = await supabase
        .from("sessions")
        .insert([{
            name: `${newSessionYear}/${newSessionYear + 1}`,
            start_year: newSessionYear,
            end_year: newSessionYear + 1,
            is_current: false
        }])
        .select("id").single();
      if (sError) throw sError;

      await supabase.from("terms").insert([
        { session_id: newSession.id, term_type: "first", is_current: false },
        { session_id: newSession.id, term_type: "second", is_current: false },
        { session_id: newSession.id, term_type: "third", is_current: false }
      ]);

      setIsCreateDialogOpen(false);
      fetchData();
      toast({ title: "New Session Created" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const sessionTerms = (sessionId: string) => terms.filter((t) => t.session_id === sessionId);

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Active Status Banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            Current Academic Context
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-12">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Session</p>
            <p className="text-3xl font-bold">{currentSession?.name || "Not Set"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Term</p>
            <p className="text-3xl font-bold">{currentTerm ? getTermLabel(currentTerm.term_type) : "Not Set"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Promotion/Roll-over Action Card */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                {isThirdTerm ? "End of Session Roll-over" : "Mid-Session Promotion"}
              </p>
              <p className="text-sm text-amber-700">
                {isThirdTerm 
                  ? "Final term detected. This will promote all students and prepare the next academic session." 
                  : "This will promote students to their next classes based on current records."}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isProcessing} className="border-amber-400 text-amber-700 hover:bg-amber-100">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isThirdTerm ? "Complete Session" : "Run Promotion")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isThirdTerm 
                    ? "This will end the current session, promote students, and activate the First Term of the next year. This action is irreversible."
                    : "Students will move up one level. SS3 students will be marked as Graduated."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSessionRollOver} className="bg-amber-600">Confirm & Process</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Session History + Create Session */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Session History</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Session</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Academic Session</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <Label>Start Year</Label>
              <Input type="number" value={newSessionYear} onChange={(e) => setNewSessionYear(parseInt(e.target.value))} />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSession}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* List Sessions */}
      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.is_current ? "ring-2 ring-primary shadow-md" : "opacity-80"}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-xl font-bold">{session.name}</h4>
                  {session.is_current && <Badge className="mt-1">Active Session</Badge>}
                </div>
                {!session.is_current && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetCurrentSession(session.id)}>
                    Set as Current
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
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