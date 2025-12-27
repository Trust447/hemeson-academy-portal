import { useState } from "react";
import { Key, Copy, Check, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { mockClasses, mockSubjects, mockTeacherTokens, generateToken, getClassName, getSubjectName } from "@/lib/mockData";
import { TeacherToken } from "@/types/database";

export function TokenGenerator() {
  const [tokens, setTokens] = useState<TeacherToken[]>(mockTeacherTokens);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateToken = () => {
    if (!selectedClass || !selectedSubject) {
      toast({
        title: "Missing Selection",
        description: "Please select both a class and a subject.",
        variant: "destructive",
      });
      return;
    }

    const newToken: TeacherToken = {
      id: String(tokens.length + 1),
      token: generateToken(),
      class_id: selectedClass,
      subject_id: selectedSubject,
      is_used: false,
      used_by: null,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    setTokens(prev => [newToken, ...prev]);
    setIsDialogOpen(false);
    setSelectedClass('');
    setSelectedSubject('');

    toast({
      title: "Token Generated",
      description: `New teacher token created for ${getClassName(selectedClass)} - ${getSubjectName(selectedSubject)}`,
    });
  };

  const handleCopyToken = async (token: string, id: string) => {
    await navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied",
      description: "Token copied to clipboard",
    });
  };

  const handleDeleteToken = (id: string) => {
    setTokens(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Token Deleted",
      description: "The teacher token has been removed.",
    });
  };

  const activeTokens = tokens.filter(t => !t.is_used).length;
  const usedTokens = tokens.filter(t => t.is_used).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{activeTokens}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{usedTokens}</p>
                <p className="text-sm text-muted-foreground">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Teacher Tokens
              </CardTitle>
              <CardDescription>
                Generate unique tokens for teachers to access specific class-subject combinations
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Teacher Token</DialogTitle>
                  <DialogDescription>
                    Create a unique token for a teacher to access a specific class and subject.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.level} {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSubjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateToken}>
                    Generate Token
                  </Button>
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
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {token.token}
                      </code>
                    </TableCell>
                    <TableCell>{token.class_id ? getClassName(token.class_id) : '-'}</TableCell>
                    <TableCell>{token.subject_id ? getSubjectName(token.subject_id) : '-'}</TableCell>
                    <TableCell>
                      {token.is_used ? (
                        <Badge variant="secondary">Used</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(token.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyToken(token.token, token.id)}
                        >
                          {copiedId === token.id ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteToken(token.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {tokens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tokens generated yet. Click "Generate Token" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
