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
      // We use 'any' here temporarily to bypass the strict type error 
      // while your database types are out of sync
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      if (allStudents) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const studentList = allStudents as any[];

        const total = studentList.length;
        const male = studentList.filter(s => s.gender === 'Male').length;
        const female = studentList.filter(s => s.gender === 'Female').length;
        
        const thisMonth = studentList.filter(s => {
          if (!s.registration_date) return false;
          const regDate = new Date(s.registration_date);
          return regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear;
        }).length;

        setStats({ total, male, female, thisMonth });
      }
    }
    getStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard title="Total Students" value={stats.total} icon={<Users className="h-4 w-4" />} color="text-blue-600" />
      <StatCard title="New This Month" value={stats.thisMonth} icon={<TrendingUp className="h-4 w-4" />} color="text-green-600" />
      <StatCard title="Male" value={stats.male} icon={<UserRound className="h-4 w-4" />} color="text-indigo-600" />
      <StatCard title="Female" value={stats.female} icon={<UserCircle2 className="h-4 w-4" />} color="text-pink-600" />
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <Card className="shadow-sm border-none bg-slate-50/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}