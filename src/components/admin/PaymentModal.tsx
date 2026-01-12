import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { feeService } from "@/services/feeService";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  studentId: string;
  onSuccess: () => void;
}

export function PaymentModal({ studentId, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Calling with exactly 2 arguments as defined in feeService.ts
      const { error } = await feeService.recordPayment(studentId, numAmount);

      if (error) throw error;

      toast({ title: "Payment Recorded", description: `Successfully added ₦${numAmount.toLocaleString()}` });
      setAmount("");
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50">
          <PlusCircle className="mr-2 h-3.5 w-3.5" /> Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Fee Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount Paid (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700" 
            onClick={handlePayment} 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}