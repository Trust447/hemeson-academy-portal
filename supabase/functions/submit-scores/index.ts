import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoreInput {
  student_id: string;
  ca1: number | null;
  ca2: number | null;
  exam: number | null;
  teacher_comment?: string;
}

function calculateGrade(total: number): string {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
}

function validateScore(value: number | null, max: number, fieldName: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || isNaN(value)) return `${fieldName} must be a number`;
  if (value < 0) return `${fieldName} cannot be negative`;
  if (value > max) return `${fieldName} cannot exceed ${max}`;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { token, scores, term_id, class_id, subject_id } = await req.json();

    if (!token || !scores || !Array.isArray(scores) || !term_id || !class_id || !subject_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, scores, term_id, class_id, subject_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (scores.length === 0) {
      return new Response(JSON.stringify({ error: 'No scores provided' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (scores.length > 100) {
      return new Response(JSON.stringify({ error: 'Too many scores. Maximum 100 students per submission.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token
    const { data: tokenData, error: tokenError } = await supabase
      .from('teacher_tokens')
      .select('*')
      .eq('token', token.toUpperCase())
      .eq('class_id', class_id)
      .eq('subject_id', subject_id)
      .maybeSingle();

    if (tokenError || !tokenData) return new Response(JSON.stringify({ error: 'Invalid or mismatched token' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (tokenData.is_used) return new Response(JSON.stringify({ error: 'Token has already been used' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) return new Response(JSON.stringify({ error: 'Token has expired' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const validationErrors: string[] = [];
    const validatedScores: any[] = [];

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i] as ScoreInput;

      if (!score.student_id) {
        validationErrors.push(`Score ${i + 1}: Missing student_id`);
        continue;
      }

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(score.student_id)) {
        validationErrors.push(`Score ${i + 1}: Invalid student_id format`);
        continue;
      }

      const ca1Error = validateScore(score.ca1, 20, 'CA1');
      const ca2Error = validateScore(score.ca2, 20, 'CA2');
      const examError = validateScore(score.exam, 60, 'Exam');

      if (ca1Error) validationErrors.push(`Student ${score.student_id}: ${ca1Error}`);
      if (ca2Error) validationErrors.push(`Student ${score.student_id}: ${ca2Error}`);
      if (examError) validationErrors.push(`Student ${score.student_id}: ${examError}`);

      if (!ca1Error && !ca2Error && !examError) {
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        validatedScores.push({
          student_id: score.student_id,
          subject_id,
          term_id,
          class_id,
          ca1: score.ca1,
          ca2: score.ca2,
          exam: score.exam,
          total,
          grade: calculateGrade(total),
          teacher_comment: score.teacher_comment?.trim().slice(0, 500) || null,
          submitted_at: new Date().toISOString()
        });
      }
    }

    // Insert valid scores only
    let savedCount = 0;
    if (validatedScores.length > 0) {
      const { data: insertedScores, error: insertError } = await supabase
        .from('scores')
        .upsert(validatedScores, {
          onConflict: 'student_id,subject_id,term_id',
          ignoreDuplicates: false
        })
        .select('id');

      if (insertError) {
        console.error('Score insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to save scores', details: insertError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      savedCount = insertedScores?.length || 0;

      // Mark token as used only if at least one score saved
      await supabase.from('teacher_tokens').update({ is_used: true }).eq('id', tokenData.id);
    }

    return new Response(JSON.stringify({
      successCount: savedCount,
      errorCount: validationErrors.length,
      errors: validationErrors.slice(0, 10),
      message: `Scores processed. ${savedCount} saved, ${validationErrors.length} failed validation.`
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
