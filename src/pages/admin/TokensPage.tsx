import { TokenGenerator } from "@/components/admin/TokenGenerator";
import { TokenList } from "@/components/admin/TokenList"; // Add this import

export default function TokensPage() {
  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Teacher Tokens</h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage unique access tokens for teachers
        </p>
      </div>
      
      {/* Step 1: Generator */}
      <TokenGenerator />

      <hr className="my-8" />

      {/* Step 2: History List */}
      <TokenList />
    </div>
  );
}