import { useEffect, useState } from "react";
import { Users, TrendingUp, UserRound, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function StudentStats() {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    male: 0,
    female: 0
  });

  useEffect(() => {
    async function getStats() {
      // Added .eq('is_active', true) to filter out Graduated and Inactive students
      const { data: activeStudents, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      if (activeStudents) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const studentList = activeStudents as any[];

        const total = studentList.length;
        
        // Stats now only calculate based on the filtered 'active' list
        const male = studentList.filter(s => s.gender?.toLowerCase() === 'male').length;
        const female = studentList.filter(s => s.gender?.toLowerCase() === 'female').length;
        
        const thisMonth = studentList.filter(s => {
          if (!s.created_at) return false; 
          const regDate = new Date(s.registration_date || s.created_at);
          return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
        }).length;

        setStats({ total, male, female, thisMonth });
      }
    }
    getStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        title="Active Students" 
        value={stats.total} 
        icon={<Users className="h-4 w-4" />} 
        color="text-blue-600" 
      />
      <StatCard 
        title="New Admissions" 
        value={stats.thisMonth} 
        icon={<TrendingUp className="h-4 w-4" />} 
        color="text-green-600" 
      />
      <StatCard 
        title="Male (Active)" 
        value={stats.male} 
        icon={<UserRound className="h-4 w-4" />} 
        color="text-indigo-600" 
      />
      <StatCard 
        title="Female (Active)" 
        value={stats.female} 
        icon={<UserCircle2 className="h-4 w-4" />} 
        color="text-pink-600" 
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <Card className="shadow-sm border-none bg-slate-50/50 hover:bg-slate-100/50 transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}