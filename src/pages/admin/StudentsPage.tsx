import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
  Search, Loader2, UserPlus, List, Upload, 
  Pencil, Trash2, MoreHorizontal, Eye, KeyRound, History, CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StudentUploader } from "@/components/admin/StudentUploader";
import { ManualStudentForm } from "@/components/admin/ManualStudentForm";
import { StudentStats } from "@/components/admin/StudentStats";
import { EditStudentForm } from "@/components/admin/EditStudentForm"; 
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [view, setView] = useState<"current" | "alumni">("current");
  
  const [refreshStats, setRefreshStats] = useState(0);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: classData } = await supabase.from('classes').select('*').order('level_order', { ascending: true });
      if (classData) setClasses(classData);

      const { data: studentData } = await (supabase
        .from('students')
        .select(`
          *,
          classes(level, level_order),
          result_pins(
            pin_code,
            terms!inner(is_current)
          )
        `) as any)
        .order('last_name', { ascending: true });

      const lastClass = classData?.[classData.length - 1];

      const processedStudents = (studentData || []).map(s => {
        let status = "Active";
        if (s.status === "graduated" || (!s.is_active && s.class_id === lastClass?.id)) {
          status = "Graduated";
        } else if (!s.is_active) {
          status = "Inactive";
        }
        return { ...s, displayStatus: status };
      });

      setStudents(processedStudents);
      setRefreshStats(prev => prev + 1);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    const { error } = await supabase.from('students').delete().eq('id', studentToDelete);
    if (error) toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    else {
      toast({ title: "Success", description: "Student deleted" });
      fetchData();
    }
    setStudentToDelete(null);
  };

  const handleStatusChange = async (student: any, newStatus: string) => {
    let updates: any = { is_active: newStatus === "Active" };
    const { error } = await supabase.from('students').update(updates).eq('id', student.id);
    if (error) toast({ title: "Error", description: "Update failed", variant: "destructive" });
    else fetchData();
  };

  const filteredData = students.filter(s => {
    if (view === "current" && s.displayStatus === "Graduated") return false;
    if (view === "alumni" && s.displayStatus !== "Graduated") return false;

    const fullName = `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || (s.admission_number || "").toLowerCase().includes(query);
    const matchesClass = view === "alumni" || classFilter === "all" || s.class_id === classFilter;
    
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {view === "current" ? "Student Management" : "Alumni Database"}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={view === "current" ? "default" : "outline"} 
            onClick={() => { setView("current"); setSearchQuery(""); }}
          >
            <List className="mr-2 h-4 w-4" /> Current
          </Button>
          <Button 
            variant={view === "alumni" ? "default" : "outline"}
            className={view === "alumni" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            onClick={() => { setView("alumni"); setSearchQuery(""); }}
          >
            <History className="mr-2 h-4 w-4" /> Alumni
          </Button>
        </div>
      </div>

      {view === "current" && <StudentStats key={refreshStats} />}

      <Tabs defaultValue="list">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="list"><Search className="h-4 w-4 mr-2" /> Directory</TabsTrigger>
          <TabsTrigger value="manual" disabled={view === "alumni"}><UserPlus className="h-4 w-4 mr-2" /> Admission</TabsTrigger>
          <TabsTrigger value="upload" disabled={view === "alumni"}><Upload className="h-4 w-4 mr-2" /> Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 pt-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={view === "current" ? "Search current students..." : "Search alumni..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {view === "current" && (
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>{view === "current" ? "Class" : "Graduation Year"}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No records found.</TableCell></TableRow>
                ) : (
                  filteredData.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs font-semibold">{student.admission_number}</TableCell>
                      <TableCell className="font-medium uppercase">{student.first_name} {student.last_name}</TableCell>
                      <TableCell>
                        {view === "current" ? (
                          student.classes?.level || "Unassigned"
                        ) : (
                          <div className="flex items-center font-bold text-blue-700">
                            <CalendarDays className="mr-2 h-4 w-4 text-blue-500" />
                            {student.graduated_at 
                              ? new Date(student.graduated_at).getFullYear() 
                              : new Date(student.updated_at).getFullYear()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {view === "current" ? (
                          <Select 
                            value={student.displayStatus} 
                            onValueChange={(v) => handleStatusChange(student, v)}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Graduated</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/students/${student.id}`)}><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStudentToEdit(student)}><Pencil className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setStudentToDelete(student.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="manual"><ManualStudentForm onSaveSuccess={fetchData} /></TabsContent>
        <TabsContent value="upload"><StudentUploader onUploadSuccess={fetchData} /></TabsContent>
      </Tabs>

      <Dialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Record?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!studentToEdit} onOpenChange={(open) => !open && setStudentToEdit(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {studentToEdit && (
            <>
              <SheetHeader>
                <SheetTitle>Edit Record</SheetTitle>
                <SheetDescription>Update information for {studentToEdit.first_name}</SheetDescription>
              </SheetHeader>
              <EditStudentForm 
                student={studentToEdit} 
                onSuccess={() => { setStudentToEdit(null); fetchData(); }} 
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}