import { SessionTermManager } from "@/components/admin/SessionTermManager";

export default function SessionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Sessions & Terms</h1>
        <p className="text-muted-foreground mt-1">
          Manage academic sessions and terms for the school
        </p>
      </div>
      
      <SessionTermManager />
    </div>
  );
}
