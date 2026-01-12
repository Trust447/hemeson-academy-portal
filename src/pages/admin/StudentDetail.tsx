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
  Calendar,
  Pencil,
  Check,
  X,
  Phone,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PaymentModal } from "@/components/admin/PaymentModal";

// ---------------- TypeScript Types ----------------
interface Class {
  id: string;
  level: string;
  section: string;
  level_order: number;
}

interface Student {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string | null;
  guardian_number?: string | null;
  address?: string | null;
  class_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  year_registered?: string | null;
  registration_date?: string | null;
  graduated_at?: string | null;
  classes?: Class;
  status?: "Active" | "Inactive" | "Graduated";
  gender?: string;
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingScholarship, setIsEditingScholarship] = useState(false);
  const [tempScholarship, setTempScholarship] = useState("");
  const [tempDate, setTempDate] = useState("");

  // 1. Fetch Student Data & Calculate Status
  const { data: student, refetch, isLoading, error } = useQuery<Student>({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) throw new Error("No student ID provided");

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`*, classes (*)`)
        .eq("id", id)
        .maybeSingle();

      if (studentError) throw studentError;
      if (!studentData) throw new Error("Student not found");

      const { data: classesData } = await (supabase
        .from("classes")
        .select("id, level_order")
        .order("level_order", { ascending: true }) as any);

      const typedClasses = classesData as Array<{ id: string; level_order: number }>;
      const lastClassId = typedClasses?.length > 0 ? typedClasses[typedClasses.length - 1].id : null;

      let calculatedStatus: "Active" | "Inactive" | "Graduated" = studentData.is_active ? "Active" : "Inactive";
      if (!studentData.is_active && studentData.class_id === lastClassId && lastClassId !== null) {
        calculatedStatus = "Graduated";
      }

      return {
        ...studentData,
        classes: studentData.classes as unknown as Class,
        status: calculatedStatus
      } as unknown as Student;
    },
  });

  // 2. Fetch the Standard Config Fee
  const { data: configFee } = useQuery({
    queryKey: ["fee_config", student?.classes?.level],
    queryFn: async () => {
      if (!student?.classes?.level) return 0;
      
      const levelText = student.classes.level;
      const category = levelText.startsWith("JSS") ? "JSS" : 
                       levelText.startsWith("SSS") ? "SSS" : "BASIC";

      const { data, error } = await (supabase
        .from("fee_configs" as any)
        .select("standard_amount")
        .eq("level_name", category)
        .maybeSingle() as any);
      
      if (error) return 0;
      return data?.standard_amount || 0;
    },
    enabled: !!student?.classes?.level
  });

  // 3. Fetch Personal Payment & Scholarship Data
  const { data: fees, refetch: refetchFees } = useQuery({
    queryKey: ["student_fees", id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("student_fees" as any)
        .select("*")
        .eq("student_id", id)
        .maybeSingle() as any);
      
      if (error) throw error;
      return data;
    },
    enabled: !!student
  });

  // Financial Math Logic
  const standardBill = configFee || 0;
  const previousDebt = (fees as any)?.previous_debt || 0;
  const scholarship = (fees as any)?.scholarship_amount || 0;
  const amountPaid = (fees as any)?.amount_paid || 0;
  const netPayable = (standardBill + previousDebt) - scholarship;
  const currentBalance = netPayable - amountPaid;

  const handleUpdateScholarship = async () => {
    const amount = Number(tempScholarship);
    if (isNaN(amount)) return;

    const { error } = await (supabase
      .from("student_fees" as any)
      .upsert({ 
        student_id: id, 
        scholarship_amount: amount 
      }, { onConflict: 'student_id' }) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to update scholarship", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Scholarship updated" });
      setIsEditingScholarship(false);
      refetchFees();
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    const { error } = await (supabase
      .from("student_fees" as any)
      .upsert({ 
        student_id: id, 
        [field]: value 
      }, { onConflict: 'student_id' }) as any);

    if (error) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Record saved" });
      refetchFees();
    }
  };

  const handleStatusChange = async (newStatus: "Active" | "Inactive") => {
    if (!student) return;
    const { error } = await supabase
      .from("students")
      .update({ is_active: newStatus === "Active" } as any)
      .eq("id", student.id);

    if (error) {
      toast({ title: "Error", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Student is now ${newStatus}` });
      refetch();
    }
  };

  const saveGraduationDate = async () => {
    if (!student || !tempDate) return;
    const { error } = await supabase
      .from("students")
      .update({ graduated_at: new Date(tempDate).toISOString() } as any)
      .eq("id", student.id);

    if (error) {
      toast({ title: "Error", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Academic timeline updated" });
      setIsEditingYear(false);
      refetch();
    }
  };

  if (isLoading) return <div className="p-10 text-center italic text-slate-500">Loading Profile...</div>;
  if (error || !student) return <div className="p-10 text-center text-red-500">Student not found.</div>;

  const startYear = student.year_registered || (student.registration_date ? new Date(student.registration_date).getFullYear() : new Date(student.created_at).getFullYear());
  const endYear = student.status === "Graduated" 
    ? (student.graduated_at ? new Date(student.graduated_at).getFullYear() : "ALUMNI")
    : student.status === "Inactive" ? "EXITED" : "PRESENT";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-500">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
        <Button onClick={() => navigate(`/admin/results/create?studentId=${id}`)} className="bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Add Academic Result
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-8 gap-6">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <User className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 capitalize">
              {student.first_name} {student.middle_name ? student.middle_name + " " : ""}{student.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground uppercase tracking-tighter text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                ADM: {student.admission_number}
              </span>
              
              {isEditingYear ? (
                <div className="flex items-center gap-1 bg-white border p-1 rounded-lg shadow-sm">
                  <Input type="date" className="h-7 text-xs w-32 border-none" onChange={(e) => setTempDate(e.target.value)} />
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={saveGraduationDate}><Check className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => setIsEditingYear(false)}><X className="h-4 w-4"/></Button>
                </div>
              ) : (
                <div onClick={() => setIsEditingYear(true)} className="flex items-center text-xs font-bold px-3 py-1.5 rounded-full bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-primary" />
                  {startYear} — {endYear}
                  <Pencil className="h-3 w-3 ml-2 opacity-40" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-none border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase">Academic Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Class Assignment</p>
                <p className="text-xl font-bold text-slate-900">
                  {student.status === "Graduated" ? "Alumni (Class of " + endYear + ")" : (student.classes?.level || "Unassigned")}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Standing</p>
                {student.status === "Graduated" ? (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-black inline-flex items-center gap-1">
                    GRADUATED <ShieldCheck className="h-3 w-3" />
                  </div>
                ) : (
                  <Select value={student.status ?? "Inactive"} onValueChange={(val) => handleStatusChange(val as any)}>
                    <SelectTrigger className="w-full h-9 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active Student</SelectItem>
                      <SelectItem value="Inactive">Inactive / Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</p>
                <p className="text-lg font-semibold text-slate-700">{student.gender || "Not Specified"}</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1"><Phone className="h-4 w-4 text-slate-400" /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Guardian Contact</p>
                  <p className="text-lg font-semibold text-slate-700">{student.guardian_number || "---"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-t-4 border-t-amber-500 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-black uppercase text-amber-600 flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Financial Ledger
                </CardTitle>
                <PaymentModal studentId={student.id} onSuccess={refetchFees} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Standard Term Fee</span>
                <span className="font-bold">₦{standardBill.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center group min-h-8">
                <div className="flex flex-col">
                  <span className="text-xs text-red-500 font-bold">Arrears (Debt)</span>
                  <span className="text-sm font-bold text-red-600">₦{previousDebt.toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" 
                  onClick={() => {
                    const val = prompt("Update Arrears:", previousDebt.toString());
                    if (val !== null) handleUpdateField('previous_debt', Number(val));
                  }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex justify-between items-center group min-h-8">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Scholarship / Rebate</span>
                  {isEditingScholarship ? (
                    <div className="flex gap-1 mt-1">
                      <Input type="number" className="h-7 w-20 text-xs" value={tempScholarship} autoFocus onChange={(e) => setTempScholarship(e.target.value)} />
                      <Button size="icon" className="h-7 w-7 bg-emerald-600" onClick={handleUpdateScholarship}><Check className="h-3 w-3 text-white"/></Button>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-blue-600">- ₦{scholarship.toLocaleString()}</span>
                  )}
                </div>
                {!isEditingScholarship && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setTempScholarship(scholarship.toString()); setIsEditingScholarship(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="flex justify-between items-end border-y py-3 bg-slate-50 px-2">
                <span className="text-xs font-black text-slate-400 uppercase">Net Payable</span>
                <span className="text-lg font-black text-slate-900">₦{netPayable.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center group min-h-8 px-2">
                <div className="flex flex-col text-emerald-600">
                  <span className="text-xs font-bold">Total Paid</span>
                  <span className="text-lg font-bold">₦{amountPaid.toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" 
                  onClick={() => {
                    const val = prompt("Edit Total Amount Paid:", amountPaid.toString());
                    if (val !== null) handleUpdateField('amount_paid', Number(val));
                  }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>

              <div className="pt-2">
                <div className={`p-4 rounded-xl text-center space-y-1 ${currentBalance > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Closing Balance</p>
                   <p className={`text-2xl font-black ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                     ₦{currentBalance.toLocaleString()}
                   </p>
                   {currentBalance > 0 && (
                     <p className="text-[9px] font-bold text-red-400 flex items-center justify-center gap-1 uppercase">
                       <ArrowUpRight className="h-3 w-3" /> Outstanding Debt
                     </p>
                   )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Finance Note
                  </span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" 
                    onClick={() => {
                      const note = prompt("Administrative Note:", (fees as any)?.finance_note || "");
                      if (note !== null) handleUpdateField('finance_note', note);
                    }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500 italic leading-snug">
                  {(fees as any)?.finance_note || "No administrative notes recorded."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-none">
            <CardContent className="pt-6 space-y-4">
              <Button 
                onClick={() => navigate(`/admin/students/${student.id}/id-card`)} 
                className="w-full bg-white text-slate-900 hover:bg-slate-200 font-black"
              >
                <Download className="mr-2 h-4 w-4" /> Download ID Card
              </Button>
              <p className="text-[10px] text-slate-500 text-center font-medium">
                Generates official school ID card with ADM: {student.admission_number}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}