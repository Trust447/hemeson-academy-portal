import { TokenGenerator } from "@/components/admin/TokenGenerator";

export default function TokensPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Teacher Tokens</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage unique access tokens for teachers
        </p>
      </div>
      
      <TokenGenerator />
    </div>
  );
}
