import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validation constants
const VALID_CLASSES = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'] as const;
const VALID_GENDERS = ['Male', 'Female'] as const;
const MAX_BATCH_SIZE = 100;
const MAX_STRING_LENGTH = 100;
const ADMISSION_NUMBER_PATTERN = /^[A-Za-z0-9/\-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface StudentInput {
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  gender?: string;
  class_level: string;
  date_of_birth?: string;
  session_id: string;
  class_id?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: StudentInput;
}

function sanitizeString(str: string | undefined, maxLength: number = MAX_STRING_LENGTH): string {
  if (!str) return '';
  // Trim, remove control characters, limit length
  return str.trim().replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);
}

function validateStudent(student: unknown, index: number): ValidationResult {
  const errors: string[] = [];
  
  if (!student || typeof student !== 'object') {
    return { valid: false, errors: [`Row ${index + 1}: Invalid student data format`] };
  }

  const s = student as Record<string, unknown>;
  
  // Required fields
  const admission_number = sanitizeString(s.admission_number as string, 50);
  const first_name = sanitizeString(s.first_name as string);
  const last_name = sanitizeString(s.last_name as string);
  const session_id = s.session_id as string;
  const class_level = sanitizeString(s.class_level as string, 10);
  
  if (!admission_number) {
    errors.push(`Row ${index + 1}: Admission number is required`);
  } else if (!ADMISSION_NUMBER_PATTERN.test(admission_number)) {
    errors.push(`Row ${index + 1}: Admission number contains invalid characters`);
  }
  
  if (!first_name) {
    errors.push(`Row ${index + 1}: First name is required`);
  } else if (first_name.length < 2) {
    errors.push(`Row ${index + 1}: First name must be at least 2 characters`);
  }
  
  if (!last_name) {
    errors.push(`Row ${index + 1}: Last name is required`);
  } else if (last_name.length < 2) {
    errors.push(`Row ${index + 1}: Last name must be at least 2 characters`);
  }
  
  if (!session_id) {
    errors.push(`Row ${index + 1}: Session ID is required`);
  } else {
    // Validate UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(session_id)) {
      errors.push(`Row ${index + 1}: Invalid session ID format`);
    }
  }
  
  if (!class_level) {
    errors.push(`Row ${index + 1}: Class is required`);
  } else if (!VALID_CLASSES.includes(class_level as typeof VALID_CLASSES[number])) {
    errors.push(`Row ${index + 1}: Invalid class "${class_level}". Must be one of: ${VALID_CLASSES.join(', ')}`);
  }
  
  // Optional fields
  const middle_name = sanitizeString(s.middle_name as string);
  const gender = sanitizeString(s.gender as string, 10);
  const date_of_birth = sanitizeString(s.date_of_birth as string, 10);
  const class_id = s.class_id as string;
  
  if (gender && !VALID_GENDERS.includes(gender as typeof VALID_GENDERS[number])) {
    errors.push(`Row ${index + 1}: Invalid gender "${gender}". Must be Male or Female`);
  }
  
  if (date_of_birth && !DATE_PATTERN.test(date_of_birth)) {
    errors.push(`Row ${index + 1}: Invalid date format. Use YYYY-MM-DD`);
  }
  
  if (class_id) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(class_id)) {
      errors.push(`Row ${index + 1}: Invalid class ID format`);
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return {
    valid: true,
    errors: [],
    sanitized: {
      admission_number,
      first_name,
      last_name,
      middle_name: middle_name || undefined,
      gender: gender || undefined,
      class_level,
      date_of_birth: date_of_birth || undefined,
      session_id,
      class_id: class_id || undefined,
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth token for RLS
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role using RPC
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('User is not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { students } = body;

    if (!Array.isArray(students)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: students must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (students.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({ error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} students` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${students.length} students for user ${user.id}`);

    // Validate all students
    const validationResults = students.map((s, i) => validateStudent(s, i));
    const allErrors = validationResults.flatMap(r => r.errors);
    const validStudents = validationResults
      .filter(r => r.valid && r.sanitized)
      .map(r => r.sanitized!);

    if (allErrors.length > 0) {
      console.log(`Validation failed with ${allErrors.length} errors`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Validation failed',
          details: allErrors,
          validCount: validStudents.length,
          errorCount: allErrors.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate admission numbers in batch
    const admissionNumbers = validStudents.map(s => s.admission_number);
    const duplicates = admissionNumbers.filter((item, index) => admissionNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Duplicate admission numbers in batch',
          details: [...new Set(duplicates)]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for insert (to bypass RLS temporarily for bulk insert)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Insert students (RLS will still apply based on the policies)
    const studentsToInsert = validStudents.map(s => ({
      admission_number: s.admission_number,
      first_name: s.first_name,
      last_name: s.last_name,
      middle_name: s.middle_name,
      gender: s.gender,
      session_id: s.session_id,
      class_id: s.class_id,
      date_of_birth: s.date_of_birth,
    }));

    const { data: insertedData, error: insertError } = await adminClient
      .from('students')
      .insert(studentsToInsert)
      .select('id, admission_number');

    if (insertError) {
      console.error('Insert error:', insertError);
      
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'Duplicate admission number exists in database',
            details: insertError.message
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to insert students', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} students`);

    return new Response(
      JSON.stringify({ 
        success: true,
        inserted: insertedData?.length || 0,
        students: insertedData
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