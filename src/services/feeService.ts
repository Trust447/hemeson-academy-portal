import { supabase } from "@/integrations/supabase/client";

export const feeService = {
  /**
   * Automatically bills a student based on their class level settings
   */
  async billStudent(studentId: string, levelName: string) {
    // 1. Get the standard price for this level
    const { data: config, error: configError } = await (supabase
      .from('fee_configs' as any)
      .select('standard_amount')
      .eq('level_name', levelName)
      .maybeSingle() as any);

    if (configError || !config) {
        console.error("Billing error:", configError);
        return;
    }

    // 2. Create the student fee record
    return await (supabase.from('student_fees' as any).insert({
      student_id: studentId,
      base_fee: config.standard_amount,
      amount_paid: 0
    }) as any);
  },

  /**
   * Updates a student's payment record (Adds to existing amount)
   */
  async recordPayment(studentId: string, newAmount: number) {
    // 1. Get current record
    const { data: record } = await (supabase
      .from('student_fees' as any)
      .select('amount_paid')
      .eq('student_id', studentId)
      .maybeSingle() as any);

    const updatedPaid = (record?.amount_paid || 0) + newAmount;

    // 2. Update database
    return await (supabase
      .from('student_fees' as any)
      .update({ amount_paid: updatedPaid } as any)
      .eq('student_id', studentId) as any);
  },

  /**
   * Adjusts the bill for scholarships or discounts
   */
  async applyScholarship(studentId: string, scholarship: number) {
    const { data: record } = await (supabase
      .from('student_fees' as any)
      .select('base_fee')
      .eq('student_id', studentId)
      .maybeSingle() as any);

    // If scholarship is applied, the total_due logic is handled by 
    // the "GENERATED" column we created in the SQL earlier.
    return await (supabase
      .from('student_fees' as any)
      .update({ 
        scholarship_amount: scholarship
      } as any)
      .eq('student_id', studentId) as any);
  }
};