import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Download,
  Plus,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------- TypeScript Types ----------------
interface Class {
  id: string;
  level: string;
  section: string;
  session_id?: string;
  created_at?: string;
  level_order: number;
}

interface ResultPinTerm {
  is_current: boolean;
}

interface ResultPin {
  pin_code: string;
  terms?: ResultPinTerm[];
}

interface Student {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string | null;
  guardian_number?: string | null;
  class_id: string | null;
  is_active: boolean;
  created_at: string;
  classes?: Class;
  result_pins?: ResultPin[];
  status?: "Active" | "Inactive" | "Graduated";
}

// ---------------- Utility to parse Supabase data safely ----------------
function parseStudentData(data: any): Student {
  const guardian_number = data.guardian_number ?? null;
  const result_pins = Array.isArray(data.result_pins)
    ? data.result_pins.map((pin: any) => ({
        pin_code: pin.pin_code ?? "",
        terms: pin.terms ?? [],
      }))
    : [];

  return {
    ...data,
    guardian_number,
    result_pins,
    status: data.is_active ? "Active" : "Inactive",
  } as Student;
}

// ---------------- Main Component ----------------
export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ---------------- Fetch student ----------------
  const { data: student, refetch, isLoading, error } = useQuery<Student>({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) throw new Error("No student ID provided");

      const { data, error: supabaseError } = await supabase
        .from("students")
        .select(`
          *,
          classes(id, level, section, session_id, created_at, level_order),
          result_pins(pin_code, terms(is_current))
        `)
        .eq("id", id)
        .maybeSingle();

      if (supabaseError) throw supabaseError;
      if (!data) throw new Error("Student not found");

      // ---------------- Get all classes to determine the last class ----------------
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, level_order")
        .order("level_order", { ascending: true })
        .returns<Class[]>(); // fixes TypeScript error

      if (classesError) throw classesError;

      const lastClassId = classesData?.[classesData.length - 1]?.id;

      // Determine status: Graduated if not active and in the last class
      let status: "Active" | "Inactive" | "Graduated" = data.is_active ? "Active" : "Inactive";
      if (!data.is_active && data.class_id === lastClassId) {
        status = "Graduated";
      }

      return { ...parseStudentData(data), status } as Student;
    },
  });

  // ---------------- Clipboard helper ----------------
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "PIN code copied to clipboard" });
  };

  // ---------------- Update student status ----------------
  const handleStatusChange = async (newStatus: "Active" | "Inactive") => {
    if (!student) return;
    if (student.status === "Graduated") return; // Prevent changing graduated status

    const updates: Partial<Student> = { is_active: newStatus === "Active" };
    const { error: updateError } = await supabase
      .from("students")
      .update(updates)
      .eq("id", student.id);

    if (updateError) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Status updated" });
      refetch();
    }
  };

  // ---------------- Loading / Error states ----------------
  if (isLoading)
    return <div className="p-10 text-center italic text-muted-foreground">Loading Profile...</div>;

  if (error || !student)
    return <div className="p-10 text-center text-red-500">Student not found.</div>;

  const currentPin = student.result_pins?.[0]?.pin_code;

  // ---------------- JSX ----------------
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => navigate(`/admin/results/create?studentId=${id}`)} className="bg-emerald-600 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Result
        </Button>
      </div>

      {/* Student Profile */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-sm">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold capitalize">
              {student.first_name} {student.middle_name ? student.middle_name + " " : ""}
              {student.last_name}
            </h1>
            <p className="text-muted-foreground uppercase tracking-widest text-sm font-mono mt-1">
              ID: {student.admission_number}
            </p>
          </div>
        </div>

        {currentPin && (
          <div className="flex flex-col items-start md:items-end">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Active Term PIN</p>
            <div
              onClick={() => copyToClipboard(currentPin)}
              className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-100 group"
            >
              <code className="text-blue-700 font-bold text-lg tracking-wider">{currentPin}</code>
              <Copy className="h-4 w-4 text-blue-400 group-hover:text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Student Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium capitalize">
              {student.first_name} {student.middle_name ? student.middle_name + " " : ""}{student.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Number</p>
            <p className="font-medium">{student.admission_number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{student.date_of_birth ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guardian Number</p>
            <p className="font-medium">{student.guardian_number ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Class</p>
            <p className="font-medium">
              {student.classes?.level ?? "N/A"} {/* Removed section */}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            {student.status === "Graduated" ? (
              <span className="text-blue-700 font-semibold">Graduated</span>
            ) : (
              <Select
                value={student.status ?? "Inactive"}
                onValueChange={(value) => handleStatusChange(value as "Active" | "Inactive")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Other Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
          <div>
            <p className="text-sm text-muted-foreground">ID Card Expiry</p>
            <p className="font-medium">
              {student.status === "Graduated"
                ? "N/A"
                : new Date(new Date(student.created_at).setFullYear(new Date(student.created_at).getFullYear() + 1))
                    .toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Created at</p>
            <p className="font-medium">{new Date(student.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* ID Card Download Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={() => navigate(`/admin/students/${student.id}/id-card`)}
          className="bg-slate-800 hover:bg-slate-900 shadow-md"
        >
          <Download className="mr-2 h-4 w-4" /> Download ID Card
        </Button>
      </div>
    </div>
  );
}
