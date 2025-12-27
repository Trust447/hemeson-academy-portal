import { useState } from "react";
import { Calendar, Check, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { mockSessions, mockTerms, getTermLabel } from "@/lib/mockData";
import { Session, Term, TermType } from "@/types/database";

export function SessionTermManager() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [terms, setTerms] = useState<Term[]>(mockTerms);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionYear, setNewSessionYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const currentSession = sessions.find(s => s.is_current);
  const currentTerm = terms.find(t => t.is_current);

  const handleSetCurrentSession = (sessionId: string) => {
    setSessions(prev => prev.map(s => ({
      ...s,
      is_current: s.id === sessionId
    })));
    toast({
      title: "Session Updated",
      description: "Current session has been changed successfully.",
    });
  };

  const handleSetCurrentTerm = (termId: string) => {
    setTerms(prev => prev.map(t => ({
      ...t,
      is_current: t.id === termId
    })));
    toast({
      title: "Term Updated",
      description: "Current term has been changed successfully.",
    });
  };

  const handleCreateSession = () => {
    const newSession: Session = {
      id: String(sessions.length + 1),
      name: `${newSessionYear}/${newSessionYear + 1}`,
      start_year: newSessionYear,
      end_year: newSessionYear + 1,
      is_current: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSessions(prev => [...prev, newSession]);

    // Create terms for the new session
    const termTypes: TermType[] = ['first', 'second', 'third'];
    const newTerms: Term[] = termTypes.map((type, index) => ({
      id: String(terms.length + index + 1),
      session_id: newSession.id,
      term_type: type,
      is_current: false,
      start_date: null,
      end_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setTerms(prev => [...prev, ...newTerms]);
    setIsCreateDialogOpen(false);
    setNewSessionYear(new Date().getFullYear());

    toast({
      title: "Session Created",
      description: `Academic session ${newSession.name} has been created with three terms.`,
    });
  };

  const sessionTerms = (sessionId: string) => terms.filter(t => t.session_id === sessionId);

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Current Academic Period
          </CardTitle>
          <CardDescription>
            Active session and term for the school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Session</p>
              <p className="text-2xl font-bold font-display">
                {currentSession?.name || 'Not Set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Term</p>
              <p className="text-2xl font-bold font-display">
                {currentTerm ? getTermLabel(currentTerm.term_type) : 'Not Set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-display">All Sessions</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Academic Session</DialogTitle>
              <DialogDescription>
                Enter the starting year for the new academic session.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Starting Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newSessionYear}
                  onChange={(e) => setNewSessionYear(parseInt(e.target.value))}
                  min={2020}
                  max={2050}
                />
                <p className="text-sm text-muted-foreground">
                  This will create session: {newSessionYear}/{newSessionYear + 1}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession}>
                Create Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.is_current ? 'ring-2 ring-primary' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-semibold font-display">{session.name}</h4>
                    {session.is_current && (
                      <Badge className="bg-primary">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Academic Year: {session.start_year} - {session.end_year}
                  </p>
                </div>
                {!session.is_current && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSetCurrentSession(session.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Set as Current
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {sessionTerms(session.id).map((term) => (
                  <button
                    key={term.id}
                    onClick={() => handleSetCurrentTerm(term.id)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${term.is_current 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }
                    `}
                  >
                    {getTermLabel(term.term_type)}
                    {term.is_current && <Check className="inline-block h-4 w-4 ml-1" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
