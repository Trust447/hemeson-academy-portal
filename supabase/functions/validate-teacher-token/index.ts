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
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format (should be alphanumeric)
    if (!/^[A-Z0-9]{8,12}$/.test(token.toUpperCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Validating token: ${token.substring(0, 4)}...`);

    // Fetch the token with class and subject info
    const { data: tokenData, error: tokenError } = await supabase
      .from('teacher_tokens')
      .select(`
        *,
        classes:class_id (id, level, section, session_id),
        subjects:subject_id (id, name, code)
      `)
      .eq('token', token.toUpperCase())
      .maybeSingle();

    if (tokenError) {
      console.error('Token query error:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', valid: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is already used
    if (tokenData.is_used) {
      return new Response(
        JSON.stringify({ 
          error: 'Token has already been used', 
          valid: false,
          expired: true 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: 'Token has expired', 
          valid: false,
          expired: true 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get students for this class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, admission_number, first_name, last_name, middle_name')
      .eq('class_id', tokenData.class_id)
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (studentsError) {
      console.error('Students query error:', studentsError);
    }

    // Get current term
    const { data: currentTerm } = await supabase
      .from('terms')
      .select('id, term_type, session_id')
      .eq('is_current', true)
      .maybeSingle();

    console.log(`Token valid for class ${tokenData.classes?.level} ${tokenData.subjects?.name}`);

    return new Response(
      JSON.stringify({
        valid: true,
        token: {
          id: tokenData.id,
          class_id: tokenData.class_id,
          subject_id: tokenData.subject_id,
          class: tokenData.classes,
          subject: tokenData.subjects,
          current_term: currentTerm
        },
        students: students || []
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