export type UserRole = 'admin' | 'teacher' | 'student';
export type TermType = 'first' | 'second' | 'third';
export type ClassLevel = 'JSS1' | 'JSS2' | 'JSS3' | 'SSS1' | 'SSS2' | 'SSS3';

export interface Session {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: string;
  session_id: string;
  term_type: TermType;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  session?: Session;
}

export interface Class {
  id: string;
  level: ClassLevel;
  section: string;
  session_id: string;
  created_at: string;
  session?: Session;
}

export interface Profile {
  id: string;
  user_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  profile_id: string | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  class_id: string | null;
  session_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
  session?: Session;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface TeacherToken {
  id: string;
  token: string;
  class_id: string | null;
  subject_id: string | null;
  is_used: boolean;
  used_by: string | null;
  expires_at: string | null;
  created_at: string;
  class?: Class;
  subject?: Subject;
}
