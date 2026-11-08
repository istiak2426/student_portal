import {
  Programme,
  Student,
  Payment,
  Assessment,
  Submission,
  Grade,
  RegistryStats,
  EnrolmentStatus,
  GradeClassification
} from './types';
import {
  loadLocalData,
  saveLocalData,
  computeStudentBalances,
  computeLocalStats,
  getDefaultSampleData
} from './localStore';

const BASE_URL = '/api';

// Helper to safely execute fetch with fallback to local store
async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (fallbackFn) return fallbackFn();
      throw new Error(`HTTP error ${res.status}`);
    }
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (fallbackFn) return fallbackFn();
      throw new Error('Non-JSON response received');
    }
    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

// 1. Fetch Stats
export async function fetchStats(): Promise<RegistryStats> {
  return safeFetch<RegistryStats>(`${BASE_URL}/stats`, undefined, () => {
    const data = loadLocalData();
    return computeLocalStats(data);
  });
}

// 2. Fetch Programmes
export async function fetchProgrammes(): Promise<Programme[]> {
  return safeFetch<Programme[]>(`${BASE_URL}/programmes`, undefined, () => {
    const data = loadLocalData();
    return data.programmes;
  });
}

// 3. Fetch Students (with filtering & balances)
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

  return safeFetch<Student[]>(`${BASE_URL}/students?${params.toString()}`, undefined, () => {
    const data = loadLocalData();
    let students = computeStudentBalances(data);

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (filters?.programme_id && filters.programme_id !== 'all') {
      students = students.filter((s) => s.programme_id === filters.programme_id);
    }

    if (filters?.status && filters.status !== 'all') {
      students = students.filter((s) => s.enrolment_status === filters.status);
    }

    if (filters?.academic_year && filters.academic_year !== 'all') {
      students = students.filter((s) => s.academic_year === filters.academic_year);
    }

    if (filters?.overdue_only) {
      students = students.filter((s) => s.is_overdue);
    }

    return students;
  });
}

// 4. Fetch Student Details
export async function fetchStudentDetails(id: string): Promise<Student & {
  payments: Payment[];
  submissions: Submission[];
  grades: Grade[];
}> {
  return safeFetch<Student & {
    payments: Payment[];
    submissions: Submission[];
    grades: Grade[];
  }>(`${BASE_URL}/students/${id}`, undefined, () => {
    const data = loadLocalData();
    const studentsWithBalances = computeStudentBalances(data);
    const student = studentsWithBalances.find((s) => s.id === id);
    if (!student) throw new Error('Student not found');

    const payments = data.payments.filter((p) => p.student_id === id);
    const submissions = data.submissions.filter((s) => s.student_id === id);
    const grades = data.grades.filter((g) => g.student_id === id);

    return {
      ...student,
      payments,
      submissions,
      grades
    };
  });
}

// 5. Create Student
export async function createStudent(data: {
  full_name: string;
  email: string;
  dob: string;
  programme_id: string;
  academic_year: string;
  enrolment_status: string;
  fee_due_date?: string;
}): Promise<Student> {
  return safeFetch<Student>(
    `${BASE_URL}/students`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    () => {
      const db = loadLocalData();
      const yearMatch = data.academic_year.match(/\b(20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      // Find next sequential ID
      const prefix = `SMS-${year}-`;
      const sameYear = db.students
        .map((s) => s.student_id)
        .filter((id) => id.startsWith(prefix))
        .map((id) => parseInt(id.replace(prefix, ''), 10))
        .filter((num) => !isNaN(num));

      const maxSeq = sameYear.length > 0 ? Math.max(...sameYear) : 0;
      const nextId = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;

      const prog = db.programmes.find((p) => p.id === data.programme_id);
      const newStudent: Student = {
        id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        student_id: nextId,
        full_name: data.full_name,
        email: data.email,
        dob: data.dob,
        programme_id: data.programme_id,
        programme_name: prog ? prog.name : '',
        programme_code: prog ? prog.code : '',
        academic_year: data.academic_year,
        enrolment_status: data.enrolment_status as EnrolmentStatus,
        fee_due_date: data.fee_due_date || `${year}-10-15`,
        created_at: new Date().toISOString()
      };

      db.students.push(newStudent);
      saveLocalData(db);
      return newStudent;
    }
  );
}

// 6. Update Student
export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  return safeFetch<Student>(
    `${BASE_URL}/students/${id}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
    () => {
      const db = loadLocalData();
      const index = db.students.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Student not found');

      db.students[index] = { ...db.students[index], ...updates };
      saveLocalData(db);
      return db.students[index];
    }
  );
}

// 7. Fetch Payments
export async function fetchPayments(student_id?: string): Promise<Payment[]> {
  const url = student_id ? `${BASE_URL}/payments?student_id=${student_id}` : `${BASE_URL}/payments`;
  return safeFetch<Payment[]>(url, undefined, () => {
    const db = loadLocalData();
    if (student_id) {
      return db.payments.filter((p) => p.student_id === student_id);
    }
    return db.payments;
  });
}

// 8. Record Payment
export async function recordPayment(data: {
  student_id: string;
  amount: number;
  payment_date: string;
  reference_number?: string;
  payment_method?: string;
  notes?: string;
}): Promise<Payment> {
  return safeFetch<Payment>(
    `${BASE_URL}/payments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    () => {
      const db = loadLocalData();
      const student = db.students.find((s) => s.id === data.student_id);
      if (!student) throw new Error('Student not found');

      const ref = data.reference_number || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newPayment: Payment = {
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        student_id: data.student_id,
        student_name: student.full_name,
        student_code: student.student_id,
        amount: data.amount,
        payment_date: data.payment_date,
        reference_number: ref,
        payment_method: data.payment_method || 'Bank Transfer',
        receipt_status: 'Confirmed',
        notes: data.notes || '',
        created_at: new Date().toISOString()
      };

      db.payments.unshift(newPayment);
      saveLocalData(db);
      return newPayment;
    }
  );
}

// 9. Fetch Assessments
export async function fetchAssessments(): Promise<Assessment[]> {
  return safeFetch<Assessment[]>(`${BASE_URL}/assessments`, undefined, () => {
    const db = loadLocalData();
    return db.assessments.map((a) => {
      const subCount = db.submissions.filter((s) => s.assessment_id === a.id).length;
      const grCount = db.grades.filter((g) => g.assessment_id === a.id).length;
      return {
        ...a,
        submission_count: subCount,
        graded_count: grCount
      };
    });
  });
}

// 10. Create Assessment
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
  return safeFetch<Assessment>(
    `${BASE_URL}/assessments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    () => {
      const db = loadLocalData();
      const prog = db.programmes.find((p) => p.id === data.programme_id);
      const newAssessment: Assessment = {
        id: `asm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: data.title,
        module_code: data.module_code,
        module_name: data.module_name,
        programme_id: data.programme_id,
        programme_name: prog ? prog.name : '',
        deadline: data.deadline,
        max_marks: data.max_marks || 100,
        pass_marks: data.pass_marks || 40,
        instructions: data.instructions || '',
        created_at: new Date().toISOString(),
        submission_count: 0,
        graded_count: 0
      };

      db.assessments.push(newAssessment);
      saveLocalData(db);
      return newAssessment;
    }
  );
}

// 11. Fetch Submissions
export async function fetchSubmissions(filters?: {
  assessment_id?: string;
  student_id?: string;
}): Promise<Submission[]> {
  const params = new URLSearchParams();
  if (filters?.assessment_id) params.set('assessment_id', filters.assessment_id);
  if (filters?.student_id) params.set('student_id', filters.student_id);

  return safeFetch<Submission[]>(`${BASE_URL}/submissions?${params.toString()}`, undefined, () => {
    const db = loadLocalData();
    let subs = db.submissions;
    if (filters?.assessment_id && filters.assessment_id !== 'all') {
      subs = subs.filter((s) => s.assessment_id === filters.assessment_id);
    }
    if (filters?.student_id) {
      subs = subs.filter((s) => s.student_id === filters.student_id);
    }
    return subs;
  });
}

// 12. Submit Assessment Work
export async function submitAssessmentWork(data: {
  assessment_id: string;
  student_id: string;
  file_name: string;
  file_size_kb?: number;
  file_type?: string;
  comments?: string;
}): Promise<Submission & { resubmitted?: boolean }> {
  return safeFetch<Submission & { resubmitted?: boolean }>(
    `${BASE_URL}/submissions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    () => {
      const db = loadLocalData();
      const assessment = db.assessments.find((a) => a.id === data.assessment_id);
      const student = db.students.find((s) => s.id === data.student_id);
      if (!assessment || !student) throw new Error('Assessment or Student not found');

      const now = new Date();
      const deadlineDate = new Date(assessment.deadline);
      const isLate = now.getTime() > deadlineDate.getTime() ? 1 : 0;

      const existingIndex = db.submissions.findIndex(
        (s) => s.assessment_id === data.assessment_id && s.student_id === data.student_id
      );

      if (existingIndex !== -1) {
        const existing = db.submissions[existingIndex];
        const newVersion = (existing.version || 1) + 1;
        const updatedSub: Submission = {
          ...existing,
          file_name: data.file_name,
          file_size_kb: data.file_size_kb || 1024,
          file_type: data.file_type || 'PDF',
          submitted_at: now.toISOString(),
          is_late: isLate,
          version: newVersion,
          comments: data.comments || existing.comments
        };
        db.submissions[existingIndex] = updatedSub;
        saveLocalData(db);
        return { ...updatedSub, resubmitted: true };
      }

      const newSub: Submission = {
        id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        assessment_id: data.assessment_id,
        assessment_title: assessment.title,
        module_code: assessment.module_code,
        student_id: data.student_id,
        student_name: student.full_name,
        student_code: student.student_id,
        file_name: data.file_name,
        file_size_kb: data.file_size_kb || 1024,
        file_type: data.file_type || 'PDF',
        submitted_at: now.toISOString(),
        is_late: isLate,
        version: 1,
        comments: data.comments || '',
        created_at: now.toISOString()
      };

      db.submissions.unshift(newSub);
      saveLocalData(db);
      return { ...newSub, resubmitted: false };
    }
  );
}

// 13. Fetch Grades
export async function fetchGrades(filters?: {
  assessment_id?: string;
  student_id?: string;
  role?: string;
}): Promise<Grade[]> {
  const params = new URLSearchParams();
  if (filters?.assessment_id) params.set('assessment_id', filters.assessment_id);
  if (filters?.student_id) params.set('student_id', filters.student_id);
  if (filters?.role) params.set('role', filters.role);

  return safeFetch<Grade[]>(`${BASE_URL}/grades?${params.toString()}`, undefined, () => {
    const db = loadLocalData();
    let gr = db.grades;
    if (filters?.assessment_id && filters.assessment_id !== 'all') {
      gr = gr.filter((g) => g.assessment_id === filters.assessment_id);
    }
    if (filters?.student_id) {
      gr = gr.filter((g) => g.student_id === filters.student_id);
    }
    if (filters?.role === 'student') {
      gr = gr.map((g) => {
        if (g.is_published === 0) {
          return {
            ...g,
            numeric_grade: -1,
            classification: 'Fail' as const,
            feedback: 'Results withheld by Registry pending moderation.',
            is_withheld: true
          };
        }
        return g;
      });
    }
    return gr;
  });
}

// 14. Record Grade
export async function recordGrade(data: {
  assessment_id: string;
  student_id: string;
  numeric_grade: number;
  is_published?: boolean;
  feedback?: string;
  graded_by?: string;
}): Promise<Grade> {
  return safeFetch<Grade>(
    `${BASE_URL}/grades`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    () => {
      const db = loadLocalData();
      const assessment = db.assessments.find((a) => a.id === data.assessment_id);
      const student = db.students.find((s) => s.id === data.student_id);
      if (!assessment || !student) throw new Error('Assessment or Student not found');

      const calculateClass = (score: number): GradeClassification => {
        if (score >= 70) return 'Distinction';
        if (score >= 60) return 'Merit';
        if (score >= 40) return 'Pass';
        return 'Fail';
      };

      const now = new Date().toISOString();
      const classification = calculateClass(data.numeric_grade);
      const isPub = data.is_published ? 1 : 0;

      const existingIndex = db.grades.findIndex(
        (g) => g.assessment_id === data.assessment_id && g.student_id === data.student_id
      );

      if (existingIndex !== -1) {
        const updatedGrade: Grade = {
          ...db.grades[existingIndex],
          numeric_grade: data.numeric_grade,
          classification,
          is_published: isPub,
          feedback: data.feedback || '',
          graded_by: data.graded_by || 'Registry Examiner',
          graded_at: now,
          published_at: isPub === 1 ? now : undefined
        };
        db.grades[existingIndex] = updatedGrade;
        saveLocalData(db);
        return updatedGrade;
      }

      const newGrade: Grade = {
        id: `grd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        assessment_id: data.assessment_id,
        assessment_title: assessment.title,
        module_code: assessment.module_code,
        student_id: data.student_id,
        student_name: student.full_name,
        student_code: student.student_id,
        numeric_grade: data.numeric_grade,
        classification,
        is_published: isPub,
        feedback: data.feedback || '',
        graded_by: data.graded_by || 'Registry Examiner',
        graded_at: now,
        published_at: isPub === 1 ? now : undefined
      };

      db.grades.unshift(newGrade);
      saveLocalData(db);
      return newGrade;
    }
  );
}

// 15. Toggle Publish
export async function togglePublishGrade(id: string, is_published?: boolean): Promise<Grade> {
  return safeFetch<Grade>(
    `${BASE_URL}/grades/${id}/publish`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published }),
    },
    () => {
      const db = loadLocalData();
      const grade = db.grades.find((g) => g.id === id);
      if (!grade) throw new Error('Grade record not found');

      const nextPub = is_published !== undefined ? (is_published ? 1 : 0) : (grade.is_published === 1 ? 0 : 1);
      grade.is_published = nextPub;
      grade.published_at = nextPub === 1 ? new Date().toISOString() : undefined;

      saveLocalData(db);
      return grade;
    }
  );
}

// 16. Publish All for Assessment
export async function publishAllAssessmentGrades(assessment_id: string, publish: boolean = true) {
  return safeFetch<{ success: boolean; assessment_id: string; is_published: number }>(
    `${BASE_URL}/assessments/${assessment_id}/publish-all`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish }),
    },
    () => {
      const db = loadLocalData();
      const pubVal = publish ? 1 : 0;
      const now = pubVal === 1 ? new Date().toISOString() : undefined;

      for (const g of db.grades) {
        if (g.assessment_id === assessment_id) {
          g.is_published = pubVal;
          g.published_at = now;
        }
      }

      saveLocalData(db);
      return { success: true, assessment_id, is_published: pubVal };
    }
  );
}

// 17. Reset Database
export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  return safeFetch<{ success: boolean; message: string }>(
    `${BASE_URL}/seed/reset`,
    { method: 'POST' },
    () => {
      const fresh = getDefaultSampleData();
      saveLocalData(fresh);
      return { success: true, message: 'Sample records restored to defaults' };
    }
  );
}
