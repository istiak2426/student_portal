export type Role = 'staff' | 'student';

export interface Programme {
  id: string;
  code: string;
  name: string;
  department: string;
  annual_fee: number;
  duration_years: number;
  student_count?: number;
}

export type EnrolmentStatus = 'Enrolled' | 'Deferred' | 'Withdrawn' | 'Completed';

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  dob: string;
  programme_id: string;
  programme_name?: string;
  programme_code?: string;
  academic_year: string;
  enrolment_status: EnrolmentStatus;
  fee_due_date: string;
  created_at: string;
  total_fee?: number;
  total_paid?: number;
  outstanding_balance?: number;
  is_overdue?: boolean;
}

export interface Payment {
  id: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  programme_name?: string;
  amount: number;
  payment_date: string;
  reference_number: string;
  payment_method: string;
  receipt_status: string;
  notes?: string;
  created_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  module_code: string;
  module_name: string;
  programme_id: string;
  programme_name?: string;
  deadline: string;
  max_marks: number;
  pass_marks: number;
  instructions: string;
  created_at: string;
  submission_count?: number;
  graded_count?: number;
}

export interface Submission {
  id: string;
  assessment_id: string;
  assessment_title?: string;
  module_code?: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  file_name: string;
  file_size_kb: number;
  file_type: string;
  submitted_at: string;
  is_late: number;
  version: number;
  comments?: string;
  created_at: string;
  deadline?: string;
}

export type GradeClassification = 'Fail' | 'Pass' | 'Merit' | 'Distinction';

export interface Grade {
  id: string;
  assessment_id: string;
  assessment_title?: string;
  module_code?: string;
  module_name?: string;
  max_marks?: number;
  student_id: string;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  numeric_grade: number;
  classification: GradeClassification;
  is_published: number;
  feedback?: string;
  graded_by: string;
  graded_at: string;
  published_at?: string;
  submitted_at?: string;
  file_name?: string;
  is_late?: number;
  is_withheld?: boolean;
}

export interface RegistryStats {
  students: {
    total: number;
    byStatus: { enrolment_status: string; count: number }[];
  };
  finance: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
    overdueCount: number;
    overdueAmount: number;
  };
  academics: {
    totalAssessments: number;
    totalSubmissions: number;
    lateSubmissions: number;
    gradeDistribution: { classification: string; count: number }[];
    publishedCount: number;
    withheldCount: number;
  };
}
