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

  // Safety initialize with empty strings if data is missing
  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || "",
    first_name: student?.first_name || "",
    last_name: student?.last_name || "",
    middle_name: student?.middle_name || "",
    gender: student?.gender || "",
    class_id: student?.class_id || "",
    guardian_number: student?.guardian_number || "",
    registration_date: student?.registration_date || "",
  });

  useEffect(() => {
    async function getClasses() {
      const { data } = await supabase.from('classes').select('*');
      if (data) setClasses(data);
    }
    getClasses();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          admission_number: formData.admission_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name,
          gender: formData.gender,
          class_id: formData.class_id,
          guardian_number: formData.guardian_number,
          registration_date: formData.registration_date,
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({ title: "Success", description: "Student updated successfully" });
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message || "Check if Admission No. already exists", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4 pt-4 pb-10">
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
        <Label className="text-blue-700 font-bold">Admission (Reg) Number</Label>
        <Input 
          required 
          value={formData.admission_number} 
          onChange={e => setFormData({...formData, admission_number: e.target.value})} 
          className="bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Class</Label>
        <Select value={formData.class_id} onValueChange={val => setFormData({...formData, class_id: val})}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Guardian Phone</Label>
        <Input value={formData.guardian_number} onChange={e => setFormData({...formData, guardian_number: e.target.value})} />
      </div>

      <div className="space-y-2">
        <Label>Registration Date</Label>
        <Input type="date" value={formData.registration_date} onChange={e => setFormData({...formData, registration_date: e.target.value})} />
      </div>

      <Button type="submit" className="w-full h-12" disabled={loading}>
        {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
      </Button>
    </form>
  );
}