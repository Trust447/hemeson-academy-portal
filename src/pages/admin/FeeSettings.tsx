import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FeeSettings() {
  const { toast } = useToast();
  const [category, setCategory] = useState(""); 
  const [amount, setAmount] = useState("");

  // 1. Fetch current fee configurations
  const { data: configs, refetch } = useQuery({
    queryKey: ["fee_configs"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("fee_configs" as any)
        .select("*")
        .order("level_name") as any);
      if (error) throw error;
      return data as any[];
    }
  });

  // 2. Upsert logic to handle Category-wide settings
  const handleSaveFee = async () => {
    if (!category || !amount) {
      toast({ title: "Error", description: "Select a category and enter amount", variant: "destructive" });
      return;
    }

    const { error } = await (supabase
      .from("fee_configs" as any)
      .upsert({ 
        level_name: category, 
        standard_amount: Number(amount) 
      }, { onConflict: 'level_name' }) as any);

    if (error) {
      toast({ title: "Database Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Standard fee for ${category} updated.` });
      setAmount("");
      refetch();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Fee Configuration</h1>
        <p className="text-muted-foreground italic text-sm">Set the standard price for each section. This will apply to all students in that category.</p>
      </div>
      
      <Card className="border-2 border-emerald-100 shadow-md">
        <CardHeader className="bg-emerald-50/30">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Set Standard Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 pt-6">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Class Category</label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick Category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASIC">Basic (Primary)</SelectItem>
                <SelectItem value="JSS">Junior Secondary (JSS 1-3)</SelectItem>
                <SelectItem value="SSS">Senior Secondary (SSS 1-3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold uppercase text-slate-500">Amount (₦)</label>
            <Input 
              placeholder="e.g. 50000" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          
          <div className="flex items-end">
            <Button onClick={handleSaveFee} className="w-full bg-emerald-700 hover:bg-emerald-800 h-10 px-8">
              <Save className="mr-2 h-4 w-4" /> Save Standard Fee
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest px-1">Active Rates</h3>
        {configs?.map((config: any) => (
          <div key={config.id} className="flex justify-between items-center p-5 bg-white border-2 rounded-xl shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">
                {config.level_name}
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">₦{Number(config.standard_amount).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  Applied to all {config.level_name} classes
                </p>
              </div>
            </div>
          </div>
        ))}
        {!configs?.length && <p className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">No categories configured yet.</p>}
      </div>
    </div>
  );
}