import { useState, useEffect } from "react";
import { Users, Calendar, Key, BookOpen, GraduationCap, TrendingUp, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// Helper for term labels (replaces mock helper)
const getTermLabel = (type: string) => {
  const labels: Record<string, string> = {
    'FIRST_TERM': 'First Term',
    'SECOND_TERM': 'Second Term',
    'THIRD_TERM': 'Third Term'
  };
  return labels[type] || type;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentCount: 0,
    classCount: 0,
    sessionCount: 0,
    activeTokens: 0,
  });
  const [currentPeriod, setCurrentPeriod] = useState<{ session: any, term: any }>({ session: null, term: null });
  const [classDistribution, setClassDistribution] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Student Count (Profiles with role 'student')
        const { count: studentCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // 2. Fetch Class Count
        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // 3. Fetch Session Count
        const { count: sessionCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

        // 4. Fetch Active Tokens (is_used = false)
        const { count: activeTokens } = await supabase
          .from('teacher_tokens')
          .select('*', { count: 'exact', head: true })
          .eq('is_used', false);

        // 5. Fetch Current Session & Term
        const { data: session } = await supabase.from('sessions').select('*').eq('is_current', true).maybeSingle();
        const { data: term } = await supabase.from('terms').select('*').eq('is_current', true).maybeSingle();

        setStats({
          studentCount: studentCount || 0,
          classCount: classCount || 0,
          sessionCount: sessionCount || 0,
          activeTokens: activeTokens || 0,
        });
        setCurrentPeriod({ session, term });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of Hemeson Academy.</p>
      </div>

      {/* Current Period Banner */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative border-none">
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Active Academic Period</p>
              <h2 className="text-2xl font-bold font-display text-white">
                {currentPeriod.session?.name || 'No Active Session'} • {currentPeriod.term ? getTermLabel(currentPeriod.term.term_type) : 'No Active Term'}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.studentCount}
          subtitle="Enrolled in system"
          icon={Users}
          variant="primary"
        />
        <StatsCard
          title="Classes"
          value={stats.classCount}
          subtitle="Managed levels"
          icon={BookOpen}
          variant="accent"
        />
        <StatsCard
          title="Sessions"
          value={stats.sessionCount}
          subtitle="Academic history"
          icon={Calendar}
          variant="default"
        />
        <StatsCard
          title="Active Tokens"
          value={stats.activeTokens}
          subtitle="Unused teacher codes"
          icon={Key}
          variant="success"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent System Events
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Activity logging will appear here as the database populates.</p>
             </div>
          </CardContent>
        </Card>

        {/* Class Level Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-accent" />
              Academic Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <p className="text-sm text-muted-foreground">
                 Currently managing <strong>{stats.classCount}</strong> classes across 
                 the <strong>{currentPeriod.session?.name}</strong> session.
               </p>
               <div className="flex flex-wrap gap-2">
                 {[
                   'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 
                   'JSS1', 'JSS2', 'JSS3', 
                   'SSS1', 'SSS2', 'SSS3'
                 ].map(lvl => (
                   <Badge key={lvl} variant="outline" className="px-3 py-1">{lvl}</Badge>
                 ))}
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}