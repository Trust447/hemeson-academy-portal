import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admission_number, pin } = await req.json();

    // Validate inputs
    if (!admission_number || !pin) {
      return new Response(
        JSON.stringify({ error: 'Admission number and PIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedAdmission = admission_number.trim().toUpperCase().slice(0, 50);
    const sanitizedPin = pin.trim().slice(0, 20);

    // Validate format
    if (!/^[A-Z0-9/\-]+$/.test(sanitizedAdmission)) {
      return new Response(
        JSON.stringify({ error: 'Invalid admission number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^[A-Z0-9]+$/i.test(sanitizedPin)) {
      return new Response(
        JSON.stringify({ error: 'Invalid PIN format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Validating PIN for admission: ${sanitizedAdmission.substring(0, 8)}...`);

    // Find student by admission number
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id, 
        admission_number, 
        first_name, 
        last_name, 
        middle_name,
        class_id,
        classes:class_id (level, section)
      `)
      .eq('admission_number', sanitizedAdmission)
      .eq('is_active', true)
      .maybeSingle();

    if (studentError) {
      console.error('Student query error:', studentError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admission number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!student) {
      return new Response(
        JSON.stringify({ error: 'Invalid admission number or PIN', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current term
    const { data: currentTerm } = await supabase
      .from('terms')
      .select('id, term_type, session_id, sessions:session_id (name)')
      .eq('is_current', true)
      .maybeSingle();

    if (!currentTerm) {
      return new Response(
        JSON.stringify({ error: 'No active term found. Please contact admin.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find PIN for this student and current term
    const { data: pinData, error: pinError } = await supabase
      .from('result_pins')
      .select('*')
      .eq('student_id', student.id)
      .eq('term_id', currentTerm.id)
      .eq('pin', sanitizedPin)
      .maybeSingle();

    if (pinError) {
      console.error('PIN query error:', pinError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify PIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pinData) {
      return new Response(
        JSON.stringify({ error: 'Invalid admission number or PIN', valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (pinData.expires_at && new Date(pinData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'PIN has expired. Please contact admin for a new PIN.',
          valid: false,
          expired: true
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check usage count
    if (pinData.usage_count >= pinData.max_uses) {
      return new Response(
        JSON.stringify({ 
          error: 'PIN usage limit reached. Please contact admin.',
          valid: false,
          usage_exceeded: true,
          usage_count: pinData.usage_count,
          max_uses: pinData.max_uses
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from('result_pins')
      .update({ usage_count: pinData.usage_count + 1 })
      .eq('id', pinData.id);

    if (updateError) {
      console.error('Usage count update error:', updateError);
      // Continue anyway, the user should still see their results
    }

    // Fetch scores for this student and term
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select(`
        *,
        subjects:subject_id (id, name, code)
      `)
      .eq('student_id', student.id)
      .eq('term_id', currentTerm.id)
      .order('subjects(name)', { ascending: true });

    if (scoresError) {
      console.error('Scores query error:', scoresError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`PIN validated for ${student.first_name} ${student.last_name}. Usage: ${pinData.usage_count + 1}/${pinData.max_uses}`);

    return new Response(
      JSON.stringify({
        valid: true,
        student: {
          id: student.id,
          admission_number: student.admission_number,
          first_name: student.first_name,
          last_name: student.last_name,
          middle_name: student.middle_name,
          class: student.classes
        },
        term: {
          id: currentTerm.id,
          type: currentTerm.term_type,
          session: currentTerm.sessions
        },
        scores: scores || [],
        usage: {
          count: pinData.usage_count + 1,
          max: pinData.max_uses,
          remaining: pinData.max_uses - (pinData.usage_count + 1)
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});