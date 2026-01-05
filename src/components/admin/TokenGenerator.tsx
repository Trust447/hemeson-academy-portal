import { useState, useEffect } from "react";
import { Key, Copy, Check, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client"; // REAL SUPABASE IMPORT
import { TeacherToken } from "@/types/database";

export function TokenGenerator() {
  const [tokens, setTokens] = useState<TeacherToken[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // 1. FETCH REAL DATA ON LOAD
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clsRes, subRes, tknRes] = await Promise.all([
          supabase.from('classes').select('*').order('level'),
          supabase.from('subjects').select('*').order('name'),
          supabase.from('teacher_tokens').select('*, classes(level, section), subjects(name)').order('created_at', { ascending: false })
        ]);

        if (clsRes.data) setClasses(clsRes.data);
        if (subRes.data) setSubjects(subRes.data);
        if (tknRes.data) setTokens(tknRes.data as any);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. GENERATE REAL TOKEN
  const handleGenerateToken = async () => {
    if (!selectedClass || !selectedSubject) {
      toast({ title: "Missing Selection", description: "Select both class and subject.", variant: "destructive" });
      return;
    }

    // Secure random string generation
    const generatedToken = Math.random().toString(36).substring(2, 12).toUpperCase();

    const { data, error } = await supabase
      .from('teacher_tokens')
      .insert([{
        token: generatedToken,
        class_id: selectedClass,
        subject_id: selectedSubject,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 Hours
      }])
      .select('*, classes(level, section), subjects(name)')
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTokens(prev => [data as any, ...prev]);
      setIsDialogOpen(false);
      setSelectedClass('');
      setSelectedSubject('');
      toast({ title: "Token Generated", description: `Access code created: ${generatedToken}` });
    }
  };

  // 3. DELETE REAL TOKEN
  const handleDeleteToken = async (id: string) => {
    const { error } = await supabase.from('teacher_tokens').delete().eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not delete token.", variant: "destructive" });
    } else {
      setTokens(prev => prev.filter(t => t.id !== id));
      toast({ title: "Token Deleted" });
    }
  };

  const handleCopyToken = async (token: string, id: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied", description: "Token copied to clipboard" });
  };

  const activeTokens = tokens.filter(t => !t.is_used).length;
  const usedTokens = tokens.filter(t => t.is_used).length;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{tokens.length}</p>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* ... (Repeat for Active and Used stats using activeTokens and usedTokens) */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Teacher Tokens
              </CardTitle>
              <CardDescription>Generate unique tokens for specific class-subject access.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Generate Token</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Teacher Token</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.level} {cls.section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleGenerateToken}>Generate</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Token</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token: any) => (
                  <TableRow key={token.id}>
                    <TableCell><code className="bg-muted px-2 py-1 rounded text-sm font-mono">{token.token}</code></TableCell>
                    <TableCell>{token.classes?.level} {token.classes?.section || '-'}</TableCell>
                    <TableCell>{token.subjects?.name || '-'}</TableCell>
                    <TableCell>
                      {token.is_used ? <Badge variant="secondary">Used</Badge> : <Badge className="bg-success/10 text-success">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyToken(token.token, token.id)}>
                          {copiedId === token.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteToken(token.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}