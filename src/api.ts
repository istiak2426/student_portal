import {
  Programme,
  Student,
  Payment,
  Assessment,
  Submission,
  Grade,
  RegistryStats
} from './types';

const BASE_URL = '/api';

export async function fetchStats(): Promise<RegistryStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) throw new Error('Failed to fetch registry stats');
  return res.json();
}

export async function fetchProgrammes(): Promise<Programme[]> {
  const res = await fetch(`${BASE_URL}/programmes`);
  if (!res.ok) throw new Error('Failed to fetch programmes');
  return res.json();
}

export async function fetchStudents(filters?: {
  search?: string;
  programme_id?: string;
  status?: string;
  academic_year?: string;
  overdue_only?: boolean;
}): Promise<Student[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.programme_id) params.set('programme_id', filters.programme_id);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.academic_year) params.set('academic_year', filters.academic_year);
  if (filters?.overdue_only) params.set('overdue_only', 'true');

  const res = await fetch(`${BASE_URL}/students?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function fetchStudentDetails(id: string): Promise<Student & {
  payments: Payment[];
  submissions: Submission[];
  grades: Grade[];
}> {
  const res = await fetch(`${BASE_URL}/students/${id}`);
  if (!res.ok) throw new Error('Failed to fetch student details');
  return res.json();
}

export async function createStudent(data: {
  full_name: string;
  email: string;
  dob: string;
  programme_id: string;
  academic_year: string;
  enrolment_status: string;
  fee_due_date?: string;
}): Promise<Student> {
  const res = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create student record');
  return json;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  const res = await fetch(`${BASE_URL}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update student');
  return json;
}

export async function fetchPayments(student_id?: string): Promise<Payment[]> {
  const url = student_id ? `${BASE_URL}/payments?student_id=${student_id}` : `${BASE_URL}/payments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}

export async function recordPayment(data: {
  student_id: string;
  amount: number;
  payment_date: string;
  reference_number?: string;
  payment_method?: string;
  notes?: string;
}): Promise<Payment> {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to record payment');
  return json;
}

export async function fetchAssessments(): Promise<Assessment[]> {
  const res = await fetch(`${BASE_URL}/assessments`);
  if (!res.ok) throw new Error('Failed to fetch assessments');
  return res.json();
}

export async function createAssessment(data: {
  title: string;
  module_code: string;
  module_name: string;
  programme_id: string;
  deadline: string;
  max_marks?: number;
  pass_marks?: number;
  instructions?: string;
}): Promise<Assessment> {
  const res = await fetch(`${BASE_URL}/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create assessment');
  return json;
}

export async function fetchSubmissions(filters?: {
  assessment_id?: string;
  student_id?: string;
}): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (filters?.assessment_id) params.set('assessment_id', filters.assessment_id);
  if (filters?.student_id) params.set('student_id', filters.student_id);

  const res = await fetch(`${BASE_URL}/submissions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

export async function submitAssessmentWork(data: {
  assessment_id: string;
  student_id: string;
  file_name: string;
  file_size_kb?: number;
  file_type?: string;
  comments?: string;
}): Promise<Submission & { resubmitted?: boolean }> {
  const res = await fetch(`${BASE_URL}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to submit assessment');
  return json;
}

export async function fetchGrades(filters?: {
  assessment_id?: string;
  student_id?: string;
  role?: string;
}): Promise<Grade[]> {
  const params = new URLSearchParams();
  if (filters?.assessment_id) params.set('assessment_id', filters.assessment_id);
  if (filters?.student_id) params.set('student_id', filters.student_id);
  if (filters?.role) params.set('role', filters.role);

  const res = await fetch(`${BASE_URL}/grades?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch grades');
  return res.json();
}

export async function recordGrade(data: {
  assessment_id: string;
  student_id: string;
  numeric_grade: number;
  is_published?: boolean;
  feedback?: string;
  graded_by?: string;
}): Promise<Grade> {
  const res = await fetch(`${BASE_URL}/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to record grade');
  return json;
}

export async function togglePublishGrade(id: string, is_published?: boolean): Promise<Grade> {
  const res = await fetch(`${BASE_URL}/grades/${id}/publish`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to toggle publication status');
  return json;
}

export async function publishAllAssessmentGrades(assessment_id: string, publish: boolean = true) {
  const res = await fetch(`${BASE_URL}/assessments/${assessment_id}/publish-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publish }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to batch publish grades');
  return json;
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/seed/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}
