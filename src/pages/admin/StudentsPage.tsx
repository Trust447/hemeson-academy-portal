import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added for page navigation
import { 
  Search, Loader2, UserPlus, List, Upload, 
  Pencil, Trash2, MoreHorizontal, Eye // Added Eye icon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StudentUploader } from "@/components/admin/StudentUploader";
import { ManualStudentForm } from "@/components/admin/ManualStudentForm";
import { StudentStats } from "@/components/admin/StudentStats";
import { EditStudentForm } from "@/components/admin/EditStudentForm"; 
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function StudentsPage() {
  const navigate = useNavigate(); // Initialize navigation
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: classData } = await supabase.from('classes').select('*');
      if (classData) setClasses(classData);

      const { data: studentData } = await supabase
        .from('students')
        .select(`*, classes(level)`) 
        .order('last_name', { ascending: true });
      
      setStudents(studentData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    const { error } = await supabase.from('students').delete().eq('id', studentToDelete);
    if (error) {
      toast({ title: "Error", description: "Could not delete student", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Student record deleted" });
      fetchData();
    }
    setStudentToDelete(null);
  };

  const filteredStudents = students.filter(s => {
    const firstName = s.first_name || "";
    const lastName = s.last_name || "";
    const adminNum = s.admission_number || "";
    const name = `${firstName} ${lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || adminNum.toLowerCase().includes(query);
    const matchesClass = classFilter === "all" || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
      </div>

      <StudentStats />

      <Tabs defaultValue="list">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="list"><List className="h-4 w-4 mr-2" /> List</TabsTrigger>
          <TabsTrigger value="manual"><UserPlus className="h-4 w-4 mr-2" /> Admission</TabsTrigger>
          <TabsTrigger value="upload"><Upload className="h-4 w-4 mr-2" /> Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 pt-4">
          <div className="flex gap-4">
            <Input 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : (
                  filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs">{student.admission_number}</TableCell>
                      <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                      <TableCell>{student.classes?.level || "Unassigned"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* NEW VIEW OPTION */}
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

      {/* DELETE MODAL */}
      <Dialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Student Record?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT SHEET */}
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