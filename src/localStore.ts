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

const STORAGE_KEY = 'pen_sms_registry_data_v2';

interface RegistryDatabase {
  programmes: Programme[];
  students: Student[];
  payments: Payment[];
  assessments: Assessment[];
  submissions: Submission[];
  grades: Grade[];
}

export function getDefaultSampleData(): RegistryDatabase {
  const now = new Date().toISOString();

  const programmes: Programme[] = [
    {
      id: 'prog-cs',
      code: 'BSc-CS',
      name: 'BSc (Hons) Computer Science',
      department: 'School of Computing & Engineering',
      annual_fee: 12500,
      duration_years: 3
    },
    {
      id: 'prog-ds',
      code: 'MSc-DS',
      name: 'MSc Data Science & Artificial Intelligence',
      department: 'School of Computing & Engineering',
      annual_fee: 15800,
      duration_years: 1
    },
    {
      id: 'prog-ba',
      code: 'BA-BA',
      name: 'BA (Hons) Business Administration',
      department: 'School of Management & Business',
      annual_fee: 10200,
      duration_years: 3
    },
    {
      id: 'prog-se',
      code: 'BEng-SE',
      name: 'BEng (Hons) Software Engineering',
      department: 'School of Computing & Engineering',
      annual_fee: 13200,
      duration_years: 3
    },
    {
      id: 'prog-cyber',
      code: 'MSc-CY',
      name: 'MSc Cyber Security & Digital Forensics',
      department: 'School of Computing & Engineering',
      annual_fee: 16500,
      duration_years: 1
    }
  ];

  const students: Student[] = [
    {
      id: 'stu-001',
      student_id: 'SMS-2025-0001',
      full_name: 'Tariq Rahman',
      email: 'tariq.rahman@student.pen.edu',
      dob: '2004-03-15',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      programme_code: 'BSc-CS',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-002',
      student_id: 'SMS-2025-0002',
      full_name: 'Sophia Zhang',
      email: 'sophia.zhang@student.pen.edu',
      dob: '2001-08-22',
      programme_id: 'prog-ds',
      programme_name: 'MSc Data Science & Artificial Intelligence',
      programme_code: 'MSc-DS',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-003',
      student_id: 'SMS-2025-0003',
      full_name: 'Liam O\'Connor',
      email: 'liam.oconnor@student.pen.edu',
      dob: '2003-11-09',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      programme_code: 'BSc-CS',
      academic_year: '2025/2026',
      enrolment_status: 'Deferred',
      fee_due_date: '2025-12-01',
      created_at: now
    },
    {
      id: 'stu-004',
      student_id: 'SMS-2024-0014',
      full_name: 'Aisha Patel',
      email: 'aisha.patel@student.pen.edu',
      dob: '2002-05-30',
      programme_id: 'prog-ba',
      programme_name: 'BA (Hons) Business Administration',
      programme_code: 'BA-BA',
      academic_year: '2024/2025',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-01-10',
      created_at: now
    },
    {
      id: 'stu-005',
      student_id: 'SMS-2024-0022',
      full_name: 'Marcus Vance',
      email: 'marcus.vance@student.pen.edu',
      dob: '1999-12-04',
      programme_id: 'prog-ds',
      programme_name: 'MSc Data Science & Artificial Intelligence',
      programme_code: 'MSc-DS',
      academic_year: '2024/2025',
      enrolment_status: 'Completed',
      fee_due_date: '2024-11-01',
      created_at: now
    },
    {
      id: 'stu-006',
      student_id: 'SMS-2025-0004',
      full_name: 'Elena Rostova',
      email: 'elena.rostova@student.pen.edu',
      dob: '2004-07-19',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      programme_code: 'BSc-CS',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-007',
      student_id: 'SMS-2025-0005',
      full_name: 'Daniel Mwangi',
      email: 'daniel.mwangi@student.pen.edu',
      dob: '2003-09-14',
      programme_id: 'prog-se',
      programme_name: 'BEng (Hons) Software Engineering',
      programme_code: 'BEng-SE',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-008',
      student_id: 'SMS-2025-0006',
      full_name: 'Chloe Bennett',
      email: 'chloe.bennett@student.pen.edu',
      dob: '2000-04-18',
      programme_id: 'prog-cyber',
      programme_name: 'MSc Cyber Security & Digital Forensics',
      programme_code: 'MSc-CY',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-009',
      student_id: 'SMS-2025-0007',
      full_name: 'James Wilson',
      email: 'james.wilson@student.pen.edu',
      dob: '2004-01-25',
      programme_id: 'prog-ba',
      programme_name: 'BA (Hons) Business Administration',
      programme_code: 'BA-BA',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    },
    {
      id: 'stu-010',
      student_id: 'SMS-2025-0008',
      full_name: 'Fatima Al-Mansoor',
      email: 'fatima.almansoor@student.pen.edu',
      dob: '2003-12-08',
      programme_id: 'prog-se',
      programme_name: 'BEng (Hons) Software Engineering',
      programme_code: 'BEng-SE',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-11-20',
      created_at: now
    },
    {
      id: 'stu-011',
      student_id: 'SMS-2024-0035',
      full_name: 'Lucas Silva',
      email: 'lucas.silva@student.pen.edu',
      dob: '2002-10-11',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      programme_code: 'BSc-CS',
      academic_year: '2024/2025',
      enrolment_status: 'Withdrawn',
      fee_due_date: '2024-10-15',
      created_at: now
    },
    {
      id: 'stu-012',
      student_id: 'SMS-2025-0009',
      full_name: 'Priya Sharma',
      email: 'priya.sharma@student.pen.edu',
      dob: '2001-06-03',
      programme_id: 'prog-ds',
      programme_name: 'MSc Data Science & Artificial Intelligence',
      programme_code: 'MSc-DS',
      academic_year: '2025/2026',
      enrolment_status: 'Enrolled',
      fee_due_date: '2025-10-15',
      created_at: now
    }
  ];

  const payments: Payment[] = [
    { id: 'pay-001', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', amount: 5000, payment_date: '2025-09-12', reference_number: 'PAY-2025-8801', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Term 1 Initial Tuition Instalment', created_at: now },
    { id: 'pay-002', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', amount: 3000, payment_date: '2025-10-20', reference_number: 'PAY-2025-8842', payment_method: 'Credit Card', receipt_status: 'Confirmed', notes: 'Term 1 Mid Instalment', created_at: now },
    { id: 'pay-003', student_id: 'stu-002', student_name: 'Sophia Zhang', student_code: 'SMS-2025-0002', amount: 15800, payment_date: '2025-09-05', reference_number: 'PAY-2025-7719', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Full Tuition Fee', created_at: now },
    { id: 'pay-004', student_id: 'stu-003', student_name: 'Liam O\'Connor', student_code: 'SMS-2025-0003', amount: 3000, payment_date: '2025-09-15', reference_number: 'PAY-2025-6602', payment_method: 'Direct Debit', receipt_status: 'Confirmed', notes: 'Enrolment Deposit', created_at: now },
    { id: 'pay-005', student_id: 'stu-004', student_name: 'Aisha Patel', student_code: 'SMS-2024-0014', amount: 5000, payment_date: '2024-10-02', reference_number: 'PAY-2024-4411', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'First Instalment 2024/25', created_at: now },
    { id: 'pay-006', student_id: 'stu-005', student_name: 'Marcus Vance', student_code: 'SMS-2024-0022', amount: 8000, payment_date: '2024-09-10', reference_number: 'PAY-2024-3301', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Term 1 Tuition', created_at: now },
    { id: 'pay-007', student_id: 'stu-005', student_name: 'Marcus Vance', student_code: 'SMS-2024-0022', amount: 7800, payment_date: '2025-01-14', reference_number: 'PAY-2025-1109', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Term 2 Final Settlement', created_at: now },
    { id: 'pay-008', student_id: 'stu-006', student_name: 'Elena Rostova', student_code: 'SMS-2025-0004', amount: 12500, payment_date: '2025-09-08', reference_number: 'PAY-2025-9921', payment_method: 'Credit Card', receipt_status: 'Confirmed', notes: 'Full Tuition Payment', created_at: now },
    { id: 'pay-009', student_id: 'stu-007', student_name: 'Daniel Mwangi', student_code: 'SMS-2025-0005', amount: 7000, payment_date: '2025-09-18', reference_number: 'PAY-2025-5510', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Semester 1 instalment', created_at: now },
    { id: 'pay-010', student_id: 'stu-008', student_name: 'Chloe Bennett', student_code: 'SMS-2025-0006', amount: 16500, payment_date: '2025-09-02', reference_number: 'PAY-2025-4420', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Full Tuition Fee', created_at: now },
    { id: 'pay-011', student_id: 'stu-009', student_name: 'James Wilson', student_code: 'SMS-2025-0007', amount: 10200, payment_date: '2025-09-11', reference_number: 'PAY-2025-3315', payment_method: 'Credit Card', receipt_status: 'Confirmed', notes: 'Annual Tuition settled', created_at: now },
    { id: 'pay-012', student_id: 'stu-010', student_name: 'Fatima Al-Mansoor', student_code: 'SMS-2025-0008', amount: 5000, payment_date: '2025-09-22', reference_number: 'PAY-2025-2201', payment_method: 'Direct Debit', receipt_status: 'Confirmed', notes: 'Term 1 Deposit', created_at: now },
    { id: 'pay-013', student_id: 'stu-010', student_name: 'Fatima Al-Mansoor', student_code: 'SMS-2025-0008', amount: 4500, payment_date: '2025-10-25', reference_number: 'PAY-2025-2202', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Term 1 Second Instalment', created_at: now },
    { id: 'pay-014', student_id: 'stu-011', student_name: 'Lucas Silva', student_code: 'SMS-2024-0035', amount: 4000, payment_date: '2024-09-14', reference_number: 'PAY-2024-1188', payment_method: 'Credit Card', receipt_status: 'Confirmed', notes: 'Initial term fee', created_at: now },
    { id: 'pay-015', student_id: 'stu-012', student_name: 'Priya Sharma', student_code: 'SMS-2025-0009', amount: 8000, payment_date: '2025-09-15', reference_number: 'PAY-2025-8833', payment_method: 'Bank Transfer', receipt_status: 'Confirmed', notes: 'Term 1 Tuition Instalment', created_at: now }
  ];

  const assessments: Assessment[] = [
    {
      id: 'asm-001',
      title: 'Algorithms & Data Structures Coursework',
      module_code: 'CS102',
      module_name: 'Algorithms & Data Structures',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      deadline: '2025-11-20T23:59',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'Implement balanced search trees and write a report benchmarking runtime operations. Submit as PDF or DOCX.',
      created_at: now,
      submission_count: 2,
      graded_count: 2
    },
    {
      id: 'asm-002',
      title: 'Deep Learning Model Optimization Project',
      module_code: 'DS501',
      module_name: 'Applied Neural Networks',
      programme_id: 'prog-ds',
      programme_name: 'MSc Data Science & Artificial Intelligence',
      deadline: '2025-11-10T17:00',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'Train and evaluate a transformer architecture with hyperparameter logs.',
      created_at: now,
      submission_count: 2,
      graded_count: 2
    },
    {
      id: 'asm-003',
      title: 'Corporate Strategic Analysis Report',
      module_code: 'BA304',
      module_name: 'Strategic Management',
      programme_id: 'prog-ba',
      programme_name: 'BA (Hons) Business Administration',
      deadline: '2025-12-05T12:00',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'Comprehensive strategic analysis of an international market entrant.',
      created_at: now,
      submission_count: 2,
      graded_count: 2
    },
    {
      id: 'asm-004',
      title: 'Software Engineering Architecture Specification',
      module_code: 'CS105',
      module_name: 'Software Architecture',
      programme_id: 'prog-cs',
      programme_name: 'BSc (Hons) Computer Science',
      deadline: '2025-10-30T18:00',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'System design document including architecture diagrams and API contracts.',
      created_at: now,
      submission_count: 1,
      graded_count: 1
    },
    {
      id: 'asm-005',
      title: 'Cloud Native Microservices Deployment',
      module_code: 'SE202',
      module_name: 'Cloud Systems Engineering',
      programme_id: 'prog-se',
      programme_name: 'BEng (Hons) Software Engineering',
      deadline: '2025-11-28T23:59',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'Deploy a containerized microservices application with automated pipeline and testing.',
      created_at: now,
      submission_count: 2,
      graded_count: 2
    },
    {
      id: 'asm-006',
      title: 'Network Penetration Testing Audit Report',
      module_code: 'CY502',
      module_name: 'Offensive Security',
      programme_id: 'prog-cyber',
      programme_name: 'MSc Cyber Security & Digital Forensics',
      deadline: '2025-11-15T16:00',
      max_marks: 100,
      pass_marks: 40,
      instructions: 'Perform a security audit against a staging network and compile an industry vulnerability mitigation report.',
      created_at: now,
      submission_count: 1,
      graded_count: 1
    }
  ];

  const submissions: Submission[] = [
    { id: 'sub-001', assessment_id: 'asm-001', assessment_title: 'Algorithms & Data Structures Coursework', module_code: 'CS102', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', file_name: 'Tariq_Rahman_CS102_Coursework_v2.pdf', file_size_kb: 1420.5, file_type: 'PDF', submitted_at: '2025-11-19T14:30', is_late: 0, version: 2, comments: 'Revised benchmark charts.', created_at: now },
    { id: 'sub-002', assessment_id: 'asm-001', assessment_title: 'Algorithms & Data Structures Coursework', module_code: 'CS102', student_id: 'stu-006', student_name: 'Elena Rostova', student_code: 'SMS-2025-0004', file_name: 'Elena_Rostova_CS102_Coursework.pdf', file_size_kb: 980.2, file_type: 'PDF', submitted_at: '2025-11-20T19:45', is_late: 0, version: 1, comments: 'Final submission.', created_at: now },
    { id: 'sub-003', assessment_id: 'asm-002', assessment_title: 'Deep Learning Model Optimization Project', module_code: 'DS501', student_id: 'stu-002', student_name: 'Sophia Zhang', student_code: 'SMS-2025-0002', file_name: 'Sophia_Zhang_DS501_Project.pdf', file_size_kb: 3450.8, file_type: 'PDF', submitted_at: '2025-11-09T11:15', is_late: 0, version: 1, comments: 'Includes evaluation metrics.', created_at: now },
    { id: 'sub-004', assessment_id: 'asm-004', assessment_title: 'Software Engineering Architecture Specification', module_code: 'CS105', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', file_name: 'Tariq_Rahman_CS105_LateSubmission.docx', file_size_kb: 1150.0, file_type: 'DOCX', submitted_at: '2025-10-31T09:12', is_late: 1, version: 1, comments: 'Submitted late due to medical extenuating circumstances.', created_at: now },
    { id: 'sub-005', assessment_id: 'asm-003', assessment_title: 'Corporate Strategic Analysis Report', module_code: 'BA304', student_id: 'stu-004', student_name: 'Aisha Patel', student_code: 'SMS-2024-0014', file_name: 'Aisha_Patel_BA304_Report.pdf', file_size_kb: 2100.4, file_type: 'PDF', submitted_at: '2025-12-04T16:20', is_late: 0, version: 1, comments: 'Case study on fintech market entry.', created_at: now },
    { id: 'sub-006', assessment_id: 'asm-005', assessment_title: 'Cloud Native Microservices Deployment', module_code: 'SE202', student_id: 'stu-007', student_name: 'Daniel Mwangi', student_code: 'SMS-2025-0005', file_name: 'Daniel_Mwangi_SE202_CloudReport.pdf', file_size_kb: 1850.2, file_type: 'PDF', submitted_at: '2025-11-27T21:10', is_late: 0, version: 1, comments: 'Cluster deployment and benchmark graphs.', created_at: now },
    { id: 'sub-007', assessment_id: 'asm-006', assessment_title: 'Network Penetration Testing Audit Report', module_code: 'CY502', student_id: 'stu-008', student_name: 'Chloe Bennett', student_code: 'SMS-2025-0006', file_name: 'Chloe_Bennett_CY502_PentestAudit.pdf', file_size_kb: 2900.0, file_type: 'PDF', submitted_at: '2025-11-14T15:40', is_late: 0, version: 1, comments: 'Risk scores and remediation recommendations.', created_at: now },
    { id: 'sub-008', assessment_id: 'asm-003', assessment_title: 'Corporate Strategic Analysis Report', module_code: 'BA304', student_id: 'stu-009', student_name: 'James Wilson', student_code: 'SMS-2025-0007', file_name: 'James_Wilson_BA304_Strategy_v2.docx', file_size_kb: 1320.5, file_type: 'DOCX', submitted_at: '2025-12-05T10:15', is_late: 0, version: 2, comments: 'Updated ratio calculations.', created_at: now },
    { id: 'sub-009', assessment_id: 'asm-005', assessment_title: 'Cloud Native Microservices Deployment', module_code: 'SE202', student_id: 'stu-010', student_name: 'Fatima Al-Mansoor', student_code: 'SMS-2025-0008', file_name: 'Fatima_AlMansoor_SE202_Project.pdf', file_size_kb: 2400.1, file_type: 'PDF', submitted_at: '2025-11-28T22:00', is_late: 0, version: 1, comments: 'Container orchestration docs.', created_at: now },
    { id: 'sub-010', assessment_id: 'asm-002', assessment_title: 'Deep Learning Model Optimization Project', module_code: 'DS501', student_id: 'stu-012', student_name: 'Priya Sharma', student_code: 'SMS-2025-0009', file_name: 'Priya_Sharma_DS501_LateSubmission.pdf', file_size_kb: 3100.0, file_type: 'PDF', submitted_at: '2025-11-11T08:30', is_late: 1, version: 1, comments: 'Late submission after training hardware delay.', created_at: now }
  ];

  const grades: Grade[] = [
    { id: 'grd-001', assessment_id: 'asm-001', assessment_title: 'Algorithms & Data Structures Coursework', module_code: 'CS102', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', numeric_grade: 78.5, classification: 'Distinction', is_published: 1, feedback: 'Exceptional search tree implementation with thorough amortized analysis.', graded_by: 'Registry Examiner', graded_at: '2025-11-25T10:00', published_at: '2025-11-26T09:00' },
    { id: 'grd-002', assessment_id: 'asm-001', assessment_title: 'Algorithms & Data Structures Coursework', module_code: 'CS102', student_id: 'stu-006', student_name: 'Elena Rostova', student_code: 'SMS-2025-0004', numeric_grade: 64.0, classification: 'Merit', is_published: 1, feedback: 'Good algorithmic rigor. Minor edge-case omissions in deletion rebalancing.', graded_by: 'Registry Examiner', graded_at: '2025-11-25T11:30', published_at: '2025-11-26T09:00' },
    { id: 'grd-003', assessment_id: 'asm-002', assessment_title: 'Deep Learning Model Optimization Project', module_code: 'DS501', student_id: 'stu-002', student_name: 'Sophia Zhang', student_code: 'SMS-2025-0002', numeric_grade: 88.0, classification: 'Distinction', is_published: 1, feedback: 'Outstanding transformer optimization and ablation analysis.', graded_by: 'Registry Examiner', graded_at: '2025-11-15T14:00', published_at: '2025-11-16T10:00' },
    { id: 'grd-004', assessment_id: 'asm-004', assessment_title: 'Software Engineering Architecture Specification', module_code: 'CS105', student_id: 'stu-001', student_name: 'Tariq Rahman', student_code: 'SMS-2025-0001', numeric_grade: 58.0, classification: 'Pass', is_published: 0, feedback: 'Solid architectural design. Results withheld pending verification of late submission.', graded_by: 'Registry Examiner', graded_at: '2025-11-05T15:00' },
    { id: 'grd-005', assessment_id: 'asm-003', assessment_title: 'Corporate Strategic Analysis Report', module_code: 'BA304', student_id: 'stu-004', student_name: 'Aisha Patel', student_code: 'SMS-2024-0014', numeric_grade: 72.0, classification: 'Distinction', is_published: 1, feedback: 'Comprehensive financial ratio triangulation and well-grounded competitive strategy.', graded_by: 'Registry Examiner', graded_at: '2025-12-10T11:00', published_at: '2025-12-11T09:00' },
    { id: 'grd-006', assessment_id: 'asm-005', assessment_title: 'Cloud Native Microservices Deployment', module_code: 'SE202', student_id: 'stu-007', student_name: 'Daniel Mwangi', student_code: 'SMS-2025-0005', numeric_grade: 81.0, classification: 'Distinction', is_published: 1, feedback: 'Superb deployment with automated health checks and clean workflow.', graded_by: 'Registry Examiner', graded_at: '2025-11-30T10:00', published_at: '2025-12-01T09:00' },
    { id: 'grd-007', assessment_id: 'asm-006', assessment_title: 'Network Penetration Testing Audit Report', module_code: 'CY502', student_id: 'stu-008', student_name: 'Chloe Bennett', student_code: 'SMS-2025-0006', numeric_grade: 92.0, classification: 'Distinction', is_published: 1, feedback: 'Exemplary report with thorough risk classification and actionable remediation.', graded_by: 'Registry Examiner', graded_at: '2025-11-18T14:30', published_at: '2025-11-19T10:00' },
    { id: 'grd-008', assessment_id: 'asm-003', assessment_title: 'Corporate Strategic Analysis Report', module_code: 'BA304', student_id: 'stu-009', student_name: 'James Wilson', student_code: 'SMS-2025-0007', numeric_grade: 66.5, classification: 'Merit', is_published: 1, feedback: 'Strong strategic analysis with sound application of Porter Five Forces.', graded_by: 'Registry Examiner', graded_at: '2025-12-10T14:00', published_at: '2025-12-11T09:00' },
    { id: 'grd-009', assessment_id: 'asm-005', assessment_title: 'Cloud Native Microservices Deployment', module_code: 'SE202', student_id: 'stu-010', student_name: 'Fatima Al-Mansoor', student_code: 'SMS-2025-0008', numeric_grade: 55.0, classification: 'Pass', is_published: 1, feedback: 'Satisfactory containerization. CI/CD pipeline lacked automated test integration.', graded_by: 'Registry Examiner', graded_at: '2025-11-30T12:00', published_at: '2025-12-01T09:00' },
    { id: 'grd-010', assessment_id: 'asm-002', assessment_title: 'Deep Learning Model Optimization Project', module_code: 'DS501', student_id: 'stu-012', student_name: 'Priya Sharma', student_code: 'SMS-2025-0009', numeric_grade: 62.0, classification: 'Merit', is_published: 0, feedback: 'Competent neural network optimization. Grade withheld pending penalty review.', graded_by: 'Registry Examiner', graded_at: '2025-11-15T16:00' }
  ];

  return { programmes, students, payments, assessments, submissions, grades };
}

export function loadLocalData(): RegistryDatabase {
  if (typeof window === 'undefined') {
    return getDefaultSampleData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.students && parsed.students.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored registry data, using defaults:', e);
  }

  const defaultData = getDefaultSampleData();
  saveLocalData(defaultData);
  return defaultData;
}

export function saveLocalData(data: RegistryDatabase): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to persist registry data to localStorage:', e);
  }
}

export function computeStudentBalances(data: RegistryDatabase): Student[] {
  const todayStr = new Date().toISOString().split('T')[0];

  return data.students.map((s) => {
    const prog = data.programmes.find((p) => p.id === s.programme_id);
    const annualFee = prog ? prog.annual_fee : 12500;
    const paid = data.payments
      .filter((p) => p.student_id === s.id)
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const outstanding = Math.max(0, annualFee - paid);
    const isOverdue = outstanding > 0 && s.fee_due_date < todayStr && s.enrolment_status === 'Enrolled';

    return {
      ...s,
      programme_name: prog ? prog.name : s.programme_name,
      programme_code: prog ? prog.code : s.programme_code,
      total_fee: annualFee,
      total_paid: paid,
      outstanding_balance: outstanding,
      is_overdue: isOverdue
    };
  });
}

export function computeLocalStats(data: RegistryDatabase): RegistryStats {
  const studentsWithBalances = computeStudentBalances(data);
  const totalBilled = studentsWithBalances.reduce((acc, s) => acc + (s.total_fee || 0), 0);
  const totalPaid = data.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  const overdueStudents = studentsWithBalances.filter((s) => s.is_overdue);
  const overdueAmount = overdueStudents.reduce((acc, s) => acc + (s.outstanding_balance || 0), 0);

  const statusMap = new Map<string, number>();
  for (const s of data.students) {
    statusMap.set(s.enrolment_status, (statusMap.get(s.enrolment_status) || 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries()).map(([enrolment_status, count]) => ({
    enrolment_status,
    count
  }));

  const classMap = new Map<string, number>();
  for (const g of data.grades) {
    classMap.set(g.classification, (classMap.get(g.classification) || 0) + 1);
  }
  const gradeDistribution = Array.from(classMap.entries()).map(([classification, count]) => ({
    classification,
    count
  }));

  const publishedCount = data.grades.filter((g) => g.is_published === 1).length;
  const withheldCount = data.grades.filter((g) => g.is_published === 0).length;
  const lateSubmissions = data.submissions.filter((s) => s.is_late === 1).length;

  return {
    students: {
      total: data.students.length,
      byStatus
    },
    finance: {
      totalBilled,
      totalPaid,
      totalOutstanding,
      collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
      overdueCount: overdueStudents.length,
      overdueAmount
    },
    academics: {
      totalAssessments: data.assessments.length,
      totalSubmissions: data.submissions.length,
      lateSubmissions,
      gradeDistribution,
      publishedCount,
      withheldCount
    }
  };
}
