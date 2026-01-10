import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TokenList() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTokens = async () => {
    setLoading(true);
    // Using 'as any' to avoid the deep instantiation error
    const { data, error } = await (supabase
      .from("teacher_tokens")
      .select("*")
      .order("created_at", { ascending: false }) as any);

    if (error) {
      toast({ title: "Error fetching tokens", description: error.message, variant: "destructive" });
    } else {
      setTokens(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Copied!", description: "Token copied to clipboard." });
  };

  const deleteToken = async (id: string) => {
    const { error } = await supabase.from("teacher_tokens").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      setTokens(tokens.filter((t) => t.id !== id));
      toast({ title: "Token deleted" });
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Generated Tokens History</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchTokens} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Assignments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.teacher_name}</TableCell>
                <TableCell>
                  <code className="bg-slate-100 px-2 py-1 rounded font-bold text-blue-700">
                    {t.token}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {Array.isArray(t.assignments) ? t.assignments.length : 0} Classes
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.is_used ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Used
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                      <XCircle className="h-3 w-3 mr-1" /> Unused
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(t.token)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteToken(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {tokens.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No tokens generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}