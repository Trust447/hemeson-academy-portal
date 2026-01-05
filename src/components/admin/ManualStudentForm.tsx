import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, Calendar } from "lucide-react";

type ClassRow = Database['public']['Tables']['classes']['Row'];

export function ManualStudentForm({ onSaveSuccess }: { onSaveSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    gender: "",
    class_id: "",
    guardian_number: "",
    registration_date: new Date().toISOString().split('T')[0], // Defaults to today
    year_registered: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    async function getClasses() {
      const { data } = await supabase.from('classes').select('*');
      if (data) setClasses(data);
    }
    getClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: session } = await supabase.from('sessions').select('id').eq('is_current', true).maybeSingle();
      if (!session) throw new Error("No active academic session found.");

      const { error } = await supabase.from('students').insert({
        admission_number: formData.admission_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        gender: formData.gender,
        class_id: formData.class_id,
        session_id: session.id,
        guardian_number: formData.guardian_number,
        registration_date: formData.registration_date,
        year_registered: formData.year_registered,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Success", description: "Student enrolled successfully." });
      onSaveSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-primary">
          <UserPlus className="h-5 w-5" /> New Student Enrollment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="space-y-2">
            <Label>Admission No.</Label>
            <Input required value={formData.admission_number} onChange={e => setFormData({...formData, admission_number: e.target.value})} placeholder="HMA/2026/001" />
          </div>

          <div className="space-y-2">
            <Label>First Name</Label>
            <Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select required onValueChange={val => setFormData({...formData, class_id: val})}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select onValueChange={val => setFormData({...formData, gender: val})}>
              <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Guardian Phone</Label>
            <Input type="tel" value={formData.guardian_number} onChange={e => setFormData({...formData, guardian_number: e.target.value})} placeholder="08012345678" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Calendar className="h-3 w-3"/> Registration Date</Label>
            <Input type="date" value={formData.registration_date} onChange={e => setFormData({...formData, registration_date: e.target.value})} />
          </div>

          <Button type="submit" className="md:col-span-3 mt-4 h-12 text-lg" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}