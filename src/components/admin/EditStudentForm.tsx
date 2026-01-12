import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function EditStudentForm({ student, onSuccess }: { student: any, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    gender: "",
    class_id: "",
    guardian_number: "",
    registration_date: "",
    date_of_birth: "",
  });

  useEffect(() => {
    async function getClasses() {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .order('level', { ascending: true });
      if (data) setClasses(data);
    }
    getClasses();
  }, []);

  useEffect(() => {
    if (student) {
      setFormData({
        admission_number: student.admission_number || "",
        first_name: student.first_name || "",
        last_name: student.last_name || "",
        middle_name: student.middle_name || "",
        gender: student.gender || "",
        class_id: student.class_id || "", 
        guardian_number: (student as any).guardian_number || "",
        registration_date: student.registration_date || "",
        date_of_birth: student.date_of_birth || "",
      });
    }
  }, [student]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;
    
    setLoading(true);

    // --- LOGIC TO UPDATE YEAR FOR DURATION ---
    // Extract the year from the registration_date string (YYYY-MM-DD)
    const yearFromDate = formData.registration_date 
      ? formData.registration_date.split('-')[0] 
      : null;

    const updateData = {
      admission_number: formData.admission_number,
      first_name: formData.first_name,
      last_name: formData.last_name,
      middle_name: formData.middle_name.trim() === "" ? null : formData.middle_name.trim(),
      gender: formData.gender || null,
      class_id: formData.class_id && formData.class_id !== "" ? formData.class_id : null,
      guardian_number: formData.guardian_number || null,
      registration_date: formData.registration_date || null,
      year_registered: yearFromDate, // This ensures the duration on the Detail page updates!
      date_of_birth: formData.date_of_birth || null,
    };

    try {
      const { error } = await supabase
        .from('students')
        .update(updateData as any) // Cast as any to avoid strict type mismatch with custom columns
        .eq('id', student.id);

      if (error) throw error;

      toast({ title: "Success", description: "Student profile updated successfully" });
      onSuccess(); 
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message || "Please check the data and try again", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4 pt-4 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Middle Name</Label>
          <Input 
            value={formData.middle_name} 
            onChange={e => setFormData({...formData, middle_name: e.target.value})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={formData.gender || undefined} onValueChange={val => setFormData({...formData, gender: val})}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={formData.class_id || undefined} onValueChange={val => setFormData({...formData, class_id: val})}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Guardian Phone</Label>
          <Input value={formData.guardian_number} onChange={e => setFormData({...formData, guardian_number: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input 
            type="date" 
            value={formData.date_of_birth} 
            onChange={e => setFormData({...formData, date_of_birth: e.target.value})} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-primary font-semibold">Registration Date</Label>
        <Input 
          type="date" 
          value={formData.registration_date} 
          onChange={e => setFormData({...formData, registration_date: e.target.value})} 
          className="border-primary/50 focus:border-primary"
        />
        <p className="text-[10px] text-muted-foreground">Changing this will update the enrollment year shown on the student profile.</p>
      </div>

      <Button type="submit" className="w-full h-12" disabled={loading}>
        {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
      </Button>
    </form>
  );
}