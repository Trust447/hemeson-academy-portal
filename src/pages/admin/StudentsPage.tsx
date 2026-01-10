import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { 
  Search, Loader2, UserPlus, List, Upload, 
  Pencil, Trash2, MoreHorizontal, Eye, KeyRound 
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
  
  const [refreshStats, setRefreshStats] = useState(0);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const { toast } = useToast();

  // ---------------- Fetch Data ----------------
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

      // Process status for each student
      const processedStudents = (studentData || []).map(s => {
        let status = "Active";
        const lastClass = classData?.[classData.length - 1];
        if (!s.is_active && s.class_id === lastClass?.id) status = "Graduated";
        else if (!s.is_active) status = "Inactive";
        return { ...s, status };
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

  // ---------------- Generate Term PINs ----------------
  const handleBulkGeneratePins = async () => {
    try {
      setIsGenerating(true);
      const { data: term } = await supabase
        .from('terms')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      if (!term) {
        toast({ 
          title: "No Active Term", 
          description: "Please set a current term in Academic Settings first.", 
          variant: "destructive" 
        });
        return;
      }

      const { error } = await (supabase.rpc as any)('bulk_generate_term_pins', { target_term_id: term.id });
      if (error) throw error;

      toast({ title: "Success", description: "PINs generated for all students for this term." });
      fetchData(); 
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------- Delete Student ----------------
  const handleDelete = async () => {
    if (!studentToDelete) return;
    const { error } = await supabase.from('students').delete().eq('id', studentToDelete);
    if (error) toast({ title: "Error", description: "Could not delete student", variant: "destructive" });
    else {
      toast({ title: "Success", description: "Student record deleted" });
      fetchData();
    }
    setStudentToDelete(null);
  };

  // ---------------- Update Status ----------------
  const handleStatusChange = async (student: any, newStatus: string) => {
    let updates: any = {};
    if (newStatus === "Active") updates.is_active = true;
    else updates.is_active = false;

    const { error } = await supabase.from('students').update(updates).eq('id', student.id);
    if (error) toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    else fetchData();
  };

  // ---------------- Filter Students ----------------
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.middle_name || ""} ${s.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || (s.admission_number || "").toLowerCase().includes(query);
    const matchesClass = classFilter === "all" || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  // ---------------- Render ----------------
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
        
        <Button 
          variant="outline" 
          onClick={handleBulkGeneratePins}
          disabled={isGenerating || isLoading}
          className="border-primary text-primary hover:bg-primary/5"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Generate Term PINs
        </Button>
      </div>

      <StudentStats key={refreshStats} />

      <Tabs defaultValue="list">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> List</TabsTrigger>
          <TabsTrigger value="manual"><UserPlus className="h-4 w-4 mr-2" /> Admission</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" /> Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 pt-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or admission number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Term PIN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs font-semibold">{student.admission_number}</TableCell>
                      <TableCell className="font-medium uppercase">
                        {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
                      </TableCell>
                      <TableCell>
                        {student.status === "Graduated" ? (
                          <Badge variant="secondary" className="text-blue-700">Graduated</Badge>
                        ) : student.classes?.level ? (
                          student.classes.level
                        ) : (
                          <Badge variant="outline" className="text-gray-400">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={student.status === "Graduated" ? "Graduated" : student.status} 
                          onValueChange={(value) => value !== "Graduated" && handleStatusChange(student, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {student.result_pins?.[0]?.pin_code ? (
                          <Badge variant="secondary" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                            {student.result_pins[0].pin_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic text-gray-400">Not Generated</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/students/${student.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View Full Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStudentToEdit(student)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setStudentToDelete(student.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                            </DropdownMenuItem>
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
          <DialogHeader><DialogTitle>Delete Student Record?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone and will delete all associated PINs.</p>
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
                <SheetTitle>Edit Student Profile</SheetTitle>
                <SheetDescription>Update information for {studentToEdit.first_name}</SheetDescription>
              </SheetHeader>
              <EditStudentForm 
                student={studentToEdit} 
                onSuccess={() => {
                  setStudentToEdit(null);
                  fetchData();
                }} 
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
