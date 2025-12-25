import { Session, Term, Class, Student, Subject, TeacherToken, ClassLevel, TermType } from '@/types/database';

export const mockSessions: Session[] = [
  {
    id: '1',
    name: '2024/2025',
    start_year: 2024,
    end_year: 2025,
    is_current: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '2',
    name: '2023/2024',
    start_year: 2023,
    end_year: 2024,
    is_current: false,
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2024-08-31T00:00:00Z',
  },
];

export const mockTerms: Term[] = [
  {
    id: '1',
    session_id: '1',
    term_type: 'first' as TermType,
    is_current: false,
    start_date: '2024-09-02',
    end_date: '2024-12-20',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '2',
    session_id: '1',
    term_type: 'second' as TermType,
    is_current: true,
    start_date: '2025-01-06',
    end_date: '2025-04-11',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    session_id: '1',
    term_type: 'third' as TermType,
    is_current: false,
    start_date: '2025-04-28',
    end_date: '2025-07-25',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
];

export const mockClasses: Class[] = [
  { id: '1', level: 'JSS1' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '2', level: 'JSS1' as ClassLevel, section: 'B', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '3', level: 'JSS2' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '4', level: 'JSS3' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '5', level: 'SSS1' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '6', level: 'SSS2' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
  { id: '7', level: 'SSS3' as ClassLevel, section: 'A', session_id: '1', created_at: '2024-09-01T00:00:00Z' },
];

export const mockSubjects: Subject[] = [
  { id: '1', name: 'Mathematics', code: 'MATH', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'English Language', code: 'ENG', created_at: '2024-01-01T00:00:00Z' },
  { id: '3', name: 'Physics', code: 'PHY', created_at: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Chemistry', code: 'CHEM', created_at: '2024-01-01T00:00:00Z' },
  { id: '5', name: 'Biology', code: 'BIO', created_at: '2024-01-01T00:00:00Z' },
  { id: '6', name: 'Geography', code: 'GEO', created_at: '2024-01-01T00:00:00Z' },
  { id: '7', name: 'Economics', code: 'ECON', created_at: '2024-01-01T00:00:00Z' },
  { id: '8', name: 'Government', code: 'GOV', created_at: '2024-01-01T00:00:00Z' },
];

export const mockStudents: Student[] = [
  {
    id: '1',
    profile_id: null,
    admission_number: 'HMA/2024/001',
    first_name: 'Adebayo',
    last_name: 'Ogundimu',
    middle_name: 'Taiwo',
    gender: 'Male',
    date_of_birth: '2010-05-15',
    class_id: '1',
    session_id: '1',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '2',
    profile_id: null,
    admission_number: 'HMA/2024/002',
    first_name: 'Chidinma',
    last_name: 'Okoro',
    middle_name: 'Ngozi',
    gender: 'Female',
    date_of_birth: '2010-08-22',
    class_id: '1',
    session_id: '1',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '3',
    profile_id: null,
    admission_number: 'HMA/2024/003',
    first_name: 'Emeka',
    last_name: 'Nwosu',
    middle_name: null,
    gender: 'Male',
    date_of_birth: '2009-12-03',
    class_id: '3',
    session_id: '1',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '4',
    profile_id: null,
    admission_number: 'HMA/2024/004',
    first_name: 'Fatima',
    last_name: 'Ibrahim',
    middle_name: 'Aisha',
    gender: 'Female',
    date_of_birth: '2008-03-18',
    class_id: '5',
    session_id: '1',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '5',
    profile_id: null,
    admission_number: 'HMA/2024/005',
    first_name: 'Oluwaseun',
    last_name: 'Adeyemi',
    middle_name: 'David',
    gender: 'Male',
    date_of_birth: '2007-07-29',
    class_id: '7',
    session_id: '1',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z',
  },
];

export const mockTeacherTokens: TeacherToken[] = [
  {
    id: '1',
    token: 'TKN-X7K9M2-2024',
    class_id: '1',
    subject_id: '1',
    is_used: false,
    used_by: null,
    expires_at: '2025-08-31T23:59:59Z',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '2',
    token: 'TKN-P3Q8R5-2024',
    class_id: '3',
    subject_id: '2',
    is_used: true,
    used_by: null,
    expires_at: '2025-08-31T23:59:59Z',
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: '3',
    token: 'TKN-L6N4W1-2024',
    class_id: '5',
    subject_id: '3',
    is_used: false,
    used_by: null,
    expires_at: '2025-08-31T23:59:59Z',
    created_at: '2024-09-15T00:00:00Z',
  },
];

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'TKN-';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  token += `-${new Date().getFullYear()}`;
  return token;
}

export function getClassName(classId: string): string {
  const cls = mockClasses.find(c => c.id === classId);
  return cls ? `${cls.level} ${cls.section}` : 'Unknown';
}

export function getSubjectName(subjectId: string): string {
  const subject = mockSubjects.find(s => s.id === subjectId);
  return subject ? subject.name : 'Unknown';
}

export function getTermLabel(termType: TermType): string {
  const labels: Record<TermType, string> = {
    first: 'First Term',
    second: 'Second Term',
    third: 'Third Term',
  };
  return labels[termType];
}
