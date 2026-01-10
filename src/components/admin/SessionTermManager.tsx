import { useState, useEffect } from "react";
import { Calendar, Check, Plus, Loader2, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TermType = Database["public"]["Enums"]["term_type"];

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
      const { data: classData, error: classError } = await supabase.from('classes').select('*');
      
      if (classError) throw classError;
      
      if (sessionData) setSessions(sessionData);
      if (termData) setTerms(termData);
      
      if (classData) {
        const sortedClasses = (classData as any[]).sort((a, b) => 
          (Number(a.level_order) || 0) - (Number(b.level_order) || 0)
        );
        setClasses(sortedClasses);
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ---------------- Updated Promotion Logic ----------------
  const handleBulkPromotion = async () => {
    if (!classes || classes.length < 2) return;

    setIsPromoting(true);
    console.log("Starting academic roll-over...");

    try {
      // Promote students using Supabase RPC
      const { error: rpcError } = await (supabase.rpc as any)('promote_all_students');
      if (rpcError) throw rpcError;

      toast({
        title: "Promotion Success",
        description: "All students promoted. SS3 students marked as graduated."
      });

      await fetchData();
    } catch (err: any) {
      console.error("Promotion failed:", err);
      toast({ title: "Promotion Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsPromoting(false);
    }
  };
  // ---------------------------------------------------------

  const handleSetCurrentSession = async (sessionId: string) => {
    try {
      await supabase.from('sessions').update({ is_current: false } as any).neq('id', sessionId);
      await supabase.from('sessions').update({ is_current: true } as any).eq('id', sessionId);
      fetchData();
      toast({ title: "Active Session Updated" });
    } catch (err) { console.error(err); }
  };

  const handleSetCurrentTerm = async (termId: string) => {
    try {
      await supabase.from('terms').update({ is_current: false } as any).neq('id', termId);
      await supabase.from('terms').update({ is_current: true } as any).eq('id', termId);
      fetchData();
      toast({ title: "Active Term Updated" });
    } catch (err) { console.error(err); }
  };

  const handleCreateSession = async () => {
    try {
      const { data: newSession, error: sError } = await supabase
        .from('sessions')
        .insert([{ 
          name: `${newSessionYear}/${newSessionYear + 1}`, 
          start_year: newSessionYear, 
          end_year: newSessionYear + 1, 
          is_current: false 
        }] as any)
        .select().single();

      if (sError) throw sError;

      const termsToInsert = [
        { session_id: newSession.id, term_type: 'first' as TermType, is_current: false },
        { session_id: newSession.id, term_type: 'second' as TermType, is_current: false },
        { session_id: newSession.id, term_type: 'third' as TermType, is_current: false }
      ];

      const { error: tError } = await supabase.from('terms').insert(termsToInsert as any);
      if (tError) throw tError;

      setIsCreateDialogOpen(false);
      fetchData();
      toast({ title: "New Session Created" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const sessionTerms = (sessionId: string) => terms.filter(t => t.session_id === sessionId);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

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
            <p className="text-3xl font-bold">{currentSession?.name || 'Not Set'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground font-semibold">Term</p>
            <p className="text-3xl font-bold">{currentTerm ? getTermLabel(currentTerm.term_type) : 'Not Set'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Promotion Action Card */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-amber-900">Academic Roll-over</p>
              <p className="text-sm text-amber-700">This will promote students to their next classes. SS3 students will be marked as graduated.</p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isPromoting} className="border-amber-400 text-amber-700 hover:bg-amber-100">
                {isPromoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Promotion"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Students will move up one level. SS3 students will be marked inactive (Graduated).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkPromotion} className="bg-amber-600">Confirm & Process</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

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

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.is_current ? 'ring-2 ring-primary shadow-md' : 'opacity-80'}>
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
