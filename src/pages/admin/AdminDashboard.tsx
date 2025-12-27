import { Users, Calendar, Key, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockSessions, mockTerms, mockStudents, mockClasses, mockTeacherTokens, getTermLabel } from "@/lib/mockData";

export default function AdminDashboard() {
  const currentSession = mockSessions.find(s => s.is_current);
  const currentTerm = mockTerms.find(t => t.is_current);
  const activeStudents = mockStudents.filter(s => s.is_active).length;
  const activeTokens = mockTeacherTokens.filter(t => !t.is_used).length;

  const recentActivity = [
    { action: 'New student added', detail: 'Adebayo Ogundimu - JSS1 A', time: '2 hours ago' },
    { action: 'Token generated', detail: 'SSS2 Mathematics', time: '5 hours ago' },
    { action: 'Term updated', detail: 'Second Term set as current', time: '1 day ago' },
    { action: 'Bulk upload', detail: '15 students added to JSS1', time: '2 days ago' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening at Hemeson Academy.
        </p>
      </div>

      {/* Current Period Banner */}
      <Card className="bg-gradient-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLThoLTJ2LTRoMnY0em0tOCA4aC0ydi00aDJ2NHptMC04aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium">Current Academic Period</p>
              <h2 className="text-2xl font-bold font-display">
                {currentSession?.name || 'No Session'} • {currentTerm ? getTermLabel(currentTerm.term_type) : 'No Term'}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={activeStudents}
          subtitle="Active enrollments"
          icon={Users}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Classes"
          value={mockClasses.length}
          subtitle="JSS1 - SSS3"
          icon={BookOpen}
          variant="accent"
        />
        <StatsCard
          title="Sessions"
          value={mockSessions.length}
          subtitle="Academic years"
          icon={Calendar}
          variant="default"
        />
        <StatsCard
          title="Active Tokens"
          value={activeTokens}
          subtitle="Teacher access"
          icon={Key}
          variant="success"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Class Distribution
            </CardTitle>
            <CardDescription>Students per class level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'].map((level) => {
                const count = mockStudents.filter(s => {
                  const cls = mockClasses.find(c => c.id === s.class_id);
                  return cls?.level === level;
                }).length;
                const percentage = (count / mockStudents.length) * 100 || 0;
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{level}</span>
                      <Badge variant="secondary">{count} students</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
