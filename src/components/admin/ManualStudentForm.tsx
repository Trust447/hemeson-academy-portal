import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, Calendar, Phone, GraduationCap } from "lucide-react";

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
    registration_date: new Date().toISOString().split('T')[0],
    year_registered: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    async function getClasses() {
      // Improved: Added ordering so Basic 1-5 appear in logical sequence
      const { data } = await supabase
        .from('classes')
        .select('*')
        .order('level', { ascending: true });
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

      toast({ title: "Success", description: `${formData.first_name} has been enrolled successfully.` });
      
      // Reset form
      setFormData({
        ...formData,
        admission_number: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        gender: "",
        class_id: "",
        guardian_number: "",
      });
      
      onSaveSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="flex items-center gap-2 text-primary font-display">
          <UserPlus className="h-6 w-6" /> Student Enrollment Portal
        </CardTitle>
        <p className="text-sm text-muted-foreground">Register students for Basic, JSS, or SSS levels.</p>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Academic Info Section */}
            {/* <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Admission No.</Label>
              <Input required value={formData.admission_number} onChange={e => setFormData({...formData, admission_number: e.target.value})} placeholder="HMA/2026/001" className="bg-slate-50 border-slate-200" />
            </div> */}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Assigned Class</Label>
              <Select required onValueChange={val => setFormData({...formData, class_id: val})} value={formData.class_id}>
                <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Choose Level" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3"/> Reg. Date
              </Label>
              <Input type="date" value={formData.registration_date} onChange={e => setFormData({...formData, registration_date: e.target.value})} className="bg-slate-50" />
            </div>

            {/* Personal Info Section */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">First Name</Label>
              <Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="John" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Middle Name</Label>
              <Input value={formData.middle_name} onChange={e => setFormData({...formData, middle_name: e.target.value})} placeholder="Olu" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Last Name</Label>
              <Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Doe" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Gender</Label>
              <Select onValueChange={val => setFormData({...formData, gender: val})} value={formData.gender}>
                <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3"/> Guardian Phone
              </Label>
              <Input type="tel" value={formData.guardian_number} onChange={e => setFormData({...formData, guardian_number: e.target.value})} placeholder="08012345678" />
            </div>

          </div>

          <Button type="submit" className="w-full mt-4 h-12 text-lg shadow-md hover:shadow-lg transition-all" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : (
              <span className="flex items-center gap-2"><GraduationCap className="h-5 w-5"/> Finalize Enrollment</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}