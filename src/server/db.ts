import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DB_FILE_PATH = path.resolve(process.cwd(), 'sms_registry.sqlite');

export interface Programme {
  id: string;
  code: string;
  name: string;
  department: string;
  annual_fee: number;
  duration_years: number;
}

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
  enrolment_status: 'Enrolled' | 'Deferred' | 'Withdrawn' | 'Completed';
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
}

export interface Grade {
  id: string;
  assessment_id: string;
  assessment_title?: string;
  module_code?: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  numeric_grade: number;
  classification: 'Fail' | 'Pass' | 'Merit' | 'Distinction';
  is_published: number;
  feedback?: string;
  graded_by: string;
  graded_at: string;
  published_at?: string;
}

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(fileBuffer);
      return db;
    } catch (e) {
      console.warn('Could not read existing sqlite file, initializing fresh database:', e);
    }
  }

  db = new SQL.Database();
  initializeSchema(db);
  seedInitialData(db);
  saveDatabase();
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initializeSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS programmes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      annual_fee REAL NOT NULL,
      duration_years INTEGER NOT NULL DEFAULT 3,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      dob TEXT NOT NULL,
      programme_id TEXT NOT NULL REFERENCES programmes(id),
      academic_year TEXT NOT NULL,
      enrolment_status TEXT NOT NULL CHECK(enrolment_status IN ('Enrolled', 'Deferred', 'Withdrawn', 'Completed')),
      fee_due_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      reference_number TEXT NOT NULL UNIQUE,
      payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
      receipt_status TEXT NOT NULL DEFAULT 'Confirmed',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      module_code TEXT NOT NULL,
      module_name TEXT NOT NULL,
      programme_id TEXT NOT NULL REFERENCES programmes(id),
      deadline TEXT NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      pass_marks REAL NOT NULL DEFAULT 40,
      instructions TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES assessments(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      file_name TEXT NOT NULL,
      file_size_kb REAL NOT NULL,
      file_type TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      is_late INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      comments TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(assessment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES assessments(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      numeric_grade REAL NOT NULL CHECK(numeric_grade >= 0 AND numeric_grade <= 100),
      classification TEXT NOT NULL CHECK(classification IN ('Fail', 'Pass', 'Merit', 'Distinction')),
      is_published INTEGER NOT NULL DEFAULT 0,
      feedback TEXT,
      graded_by TEXT NOT NULL DEFAULT 'Registry Examiner',
      graded_at TEXT NOT NULL,
      published_at TEXT,
      UNIQUE(assessment_id, student_id)
    );
  `);
}

export function calculateClassification(grade: number): 'Fail' | 'Pass' | 'Merit' | 'Distinction' {
  if (grade >= 70) return 'Distinction';
  if (grade >= 60) return 'Merit';
  if (grade >= 40) return 'Pass';
  return 'Fail';
}

export function generateNextStudentId(year: number = 2025): string {
  if (!db) return `SMS-${year}-0001`;
  const prefix = `SMS-${year}-%`;
  const result = db.exec(`SELECT student_id FROM students WHERE student_id LIKE '${prefix}' ORDER BY student_id DESC LIMIT 1`);
  if (!result || result.length === 0 || result[0].values.length === 0) {
    return `SMS-${year}-0001`;
  }
  const lastId = result[0].values[0][0] as string;
  const parts = lastId.split('-');
  const seq = parseInt(parts[2], 10);
  const nextSeq = isNaN(seq) ? 1 : seq + 1;
  return `SMS-${year}-${String(nextSeq).padStart(4, '0')}`;
}

export function queryAll<T>(sql: string, params: any[] = []): T[] {
  if (!db) return [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(sql: string, params: any[] = []): void {
  if (!db) return;
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDatabase();
}

export function seedInitialData(database: Database): void {
  const now = new Date().toISOString();
  
  // 5 Programmes
  database.run(`
    INSERT OR REPLACE INTO programmes (id, code, name, department, annual_fee, duration_years, created_at) VALUES
    ('prog-cs', 'BSc-CS', 'BSc (Hons) Computer Science', 'School of Computing & Engineering', 12500, 3, '${now}'),
    ('prog-ds', 'MSc-DS', 'MSc Data Science & Artificial Intelligence', 'School of Computing & Engineering', 15800, 1, '${now}'),
    ('prog-ba', 'BA-BA', 'BA (Hons) Business Administration', 'School of Management & Business', 10200, 3, '${now}'),
    ('prog-se', 'BEng-SE', 'BEng (Hons) Software Engineering', 'School of Computing & Engineering', 13200, 3, '${now}'),
    ('prog-cyber', 'MSc-CY', 'MSc Cyber Security & Digital Forensics', 'School of Computing & Engineering', 16500, 1, '${now}');
  `);

  // 12 Diverse Students
  database.run(`
    INSERT OR REPLACE INTO students (id, student_id, full_name, email, dob, programme_id, academic_year, enrolment_status, fee_due_date, created_at) VALUES
    ('stu-001', 'SMS-2025-0001', 'Tariq Rahman', 'tariq.rahman@student.pen.edu', '2004-03-15', 'prog-cs', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-002', 'SMS-2025-0002', 'Sophia Zhang', 'sophia.zhang@student.pen.edu', '2001-08-22', 'prog-ds', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-003', 'SMS-2025-0003', 'Liam O''Connor', 'liam.oconnor@student.pen.edu', '2003-11-09', 'prog-cs', '2025/2026', 'Deferred', '2025-12-01', '${now}'),
    ('stu-004', 'SMS-2024-0014', 'Aisha Patel', 'aisha.patel@student.pen.edu', '2002-05-30', 'prog-ba', '2024/2025', 'Enrolled', '2025-01-10', '${now}'),
    ('stu-005', 'SMS-2024-0022', 'Marcus Vance', 'marcus.vance@student.pen.edu', '1999-12-04', 'prog-ds', '2024/2025', 'Completed', '2024-11-01', '${now}'),
    ('stu-006', 'SMS-2025-0004', 'Elena Rostova', 'elena.rostova@student.pen.edu', '2004-07-19', 'prog-cs', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-007', 'SMS-2025-0005', 'Daniel Mwangi', 'daniel.mwangi@student.pen.edu', '2003-09-14', 'prog-se', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-008', 'SMS-2025-0006', 'Chloe Bennett', 'chloe.bennett@student.pen.edu', '2000-04-18', 'prog-cyber', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-009', 'SMS-2025-0007', 'James Wilson', 'james.wilson@student.pen.edu', '2004-01-25', 'prog-ba', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-010', 'SMS-2025-0008', 'Fatima Al-Mansoor', 'fatima.almansoor@student.pen.edu', '2003-12-08', 'prog-se', '2025/2026', 'Enrolled', '2025-11-20', '${now}'),
    ('stu-011', 'SMS-2024-0035', 'Lucas Silva', 'lucas.silva@student.pen.edu', '2002-10-11', 'prog-cs', '2024/2025', 'Withdrawn', '2024-10-15', '${now}'),
    ('stu-012', 'SMS-2025-0009', 'Priya Sharma', 'priya.sharma@student.pen.edu', '2001-06-03', 'prog-ds', '2025/2026', 'Enrolled', '2025-10-15', '${now}');
  `);

  // Fee Payments
  database.run(`
    INSERT OR REPLACE INTO payments (id, student_id, amount, payment_date, reference_number, payment_method, receipt_status, notes, created_at) VALUES
    ('pay-001', 'stu-001', 5000, '2025-09-12', 'PAY-2025-8801', 'Bank Transfer', 'Confirmed', 'Term 1 Initial Tuition Instalment', '${now}'),
    ('pay-002', 'stu-001', 3000, '2025-10-20', 'PAY-2025-8842', 'Credit Card', 'Confirmed', 'Term 1 Mid Instalment', '${now}'),
    ('pay-003', 'stu-002', 15800, '2025-09-05', 'PAY-2025-7719', 'Bank Transfer', 'Confirmed', 'Full Postgraduate Tuition Fee upfront', '${now}'),
    ('pay-004', 'stu-003', 3000, '2025-09-15', 'PAY-2025-6602', 'Direct Debit', 'Confirmed', 'Enrolment Deposit', '${now}'),
    ('pay-005', 'stu-004', 5000, '2024-10-02', 'PAY-2024-4411', 'Bank Transfer', 'Confirmed', 'First Instalment 2024/25', '${now}'),
    ('pay-006', 'stu-005', 8000, '2024-09-10', 'PAY-2024-3301', 'Bank Transfer', 'Confirmed', 'Term 1 Tuition', '${now}'),
    ('pay-007', 'stu-005', 7800, '2025-01-14', 'PAY-2025-1109', 'Bank Transfer', 'Confirmed', 'Term 2 Final Settlement', '${now}'),
    ('pay-008', 'stu-006', 12500, '2025-09-08', 'PAY-2025-9921', 'Credit Card', 'Confirmed', 'Full Undergraduate Tuition Payment', '${now}'),
    ('pay-009', 'stu-007', 7000, '2025-09-18', 'PAY-2025-5510', 'Bank Transfer', 'Confirmed', 'Semester 1 instalment', '${now}'),
    ('pay-010', 'stu-008', 16500, '2025-09-02', 'PAY-2025-4420', 'Bank Transfer', 'Confirmed', 'Full Postgraduate Tuition Fee upfront', '${now}'),
    ('pay-011', 'stu-009', 10200, '2025-09-11', 'PAY-2025-3315', 'Credit Card', 'Confirmed', 'Annual Tuition settled in full', '${now}'),
    ('pay-012', 'stu-010', 5000, '2025-09-22', 'PAY-2025-2201', 'Direct Debit', 'Confirmed', 'Term 1 Deposit', '${now}'),
    ('pay-013', 'stu-010', 4500, '2025-10-25', 'PAY-2025-2202', 'Bank Transfer', 'Confirmed', 'Term 1 Second Instalment', '${now}'),
    ('pay-014', 'stu-011', 4000, '2024-09-14', 'PAY-2024-1188', 'Credit Card', 'Confirmed', 'Initial term fee before withdrawal', '${now}'),
    ('pay-015', 'stu-012', 8000, '2025-09-15', 'PAY-2025-8833', 'Bank Transfer', 'Confirmed', 'Term 1 Tuition Instalment', '${now}');
  `);

  // 6 Assessments
  database.run(`
    INSERT OR REPLACE INTO assessments (id, title, module_code, module_name, programme_id, deadline, max_marks, pass_marks, instructions, created_at) VALUES
    ('asm-001', 'Algorithms & Data Structures Coursework', 'CS102', 'Algorithms & Data Structures', 'prog-cs', '2025-11-20T23:59', 100, 40, 'Implement balanced AVL search trees and write a benchmarking report comparing O(log n) operations against hash tables. Submit as PDF or DOCX.', '${now}'),
    ('asm-002', 'Deep Learning Model Optimization Project', 'DS501', 'Applied Neural Networks', 'prog-ds', '2025-11-10T17:00', 100, 40, 'Train and evaluate a transformer architecture on custom domain data with ablation studies and hyperparameter logs.', '${now}'),
    ('asm-003', 'Corporate Strategic Analysis Report', 'BA304', 'Strategic Management', 'prog-ba', '2025-12-05T12:00', 100, 40, 'Comprehensive strategic analysis of an international market entrant using Porter Five Forces, VRIO, and financial ratios.', '${now}'),
    ('asm-004', 'Software Engineering Architecture Specification', 'CS105', 'Software Architecture', 'prog-cs', '2025-10-30T18:00', 100, 40, 'System design document including C4 architecture diagrams and REST API schema contracts.', '${now}'),
    ('asm-005', 'Cloud Native Microservices Deployment', 'SE202', 'Cloud Systems Engineering', 'prog-se', '2025-11-28T23:59', 100, 40, 'Deploy a containerized microservices application with automated CI/CD pipeline and load testing analysis.', '${now}'),
    ('asm-006', 'Network Penetration Testing Audit Report', 'CY502', 'Offensive Security', 'prog-cyber', '2025-11-15T16:00', 100, 40, 'Perform a black-box security audit against a sandbox staging network and compile an industry vulnerability mitigation report.', '${now}');
  `);

  // Submissions
  database.run(`
    INSERT OR REPLACE INTO submissions (id, assessment_id, student_id, file_name, file_size_kb, file_type, submitted_at, is_late, version, comments, created_at) VALUES
    ('sub-001', 'asm-001', 'stu-001', 'Tariq_Rahman_CS102_Coursework_v2.pdf', 1420.5, 'PDF', '2025-11-19T14:30', 0, 2, 'Revised benchmark charts as per lab feedback.', '${now}'),
    ('sub-002', 'asm-001', 'stu-006', 'Elena_Rostova_CS102_Coursework.pdf', 980.2, 'PDF', '2025-11-20T19:45', 0, 1, 'Final submission with full code repository appendix.', '${now}'),
    ('sub-003', 'asm-002', 'stu-002', 'Sophia_Zhang_DS501_Project.pdf', 3450.8, 'PDF', '2025-11-09T11:15', 0, 1, 'Includes PyTorch checkpoints evaluation metrics and ROC curves.', '${now}'),
    ('sub-004', 'asm-004', 'stu-001', 'Tariq_Rahman_CS105_LateSubmission.docx', 1150.0, 'DOCX', '2025-10-31T09:12', 1, 1, 'Submitted 15 hours late due to medical extenuating circumstance application pending.', '${now}'),
    ('sub-005', 'asm-003', 'stu-004', 'Aisha_Patel_BA304_Report.pdf', 2100.4, 'PDF', '2025-12-04T16:20', 0, 1, 'Case study on fintech market entry in Southeast Asia.', '${now}'),
    ('sub-006', 'asm-005', 'stu-007', 'Daniel_Mwangi_SE202_CloudReport.pdf', 1850.2, 'PDF', '2025-11-27T21:10', 0, 1, 'Kubernetes cluster deployment and latency benchmark graphs.', '${now}'),
    ('sub-007', 'asm-006', 'stu-008', 'Chloe_Bennett_CY502_PentestAudit.pdf', 2900.0, 'PDF', '2025-11-14T15:40', 0, 1, 'Complete vulnerability mitigation matrix and CVSS risk scores.', '${now}'),
    ('sub-008', 'asm-003', 'stu-009', 'James_Wilson_BA304_Strategy_v2.docx', 1320.5, 'DOCX', '2025-12-05T10:15', 0, 2, 'Updated SWOT and financial ratio calculations.', '${now}'),
    ('sub-009', 'asm-005', 'stu-010', 'Fatima_AlMansoor_SE202_Project.pdf', 2400.1, 'PDF', '2025-11-28T22:00', 0, 1, 'Terraform scripts and container orchestration docs.', '${now}'),
    ('sub-010', 'asm-002', 'stu-012', 'Priya_Sharma_DS501_LateSubmission.pdf', 3100.0, 'PDF', '2025-11-11T08:30', 1, 1, 'Submitted late following power outage during model training.', '${now}');
  `);

  // Grades (Distinction, Merit, Pass, Fail, Published, Withheld)
  database.run(`
    INSERT OR REPLACE INTO grades (id, assessment_id, student_id, numeric_grade, classification, is_published, feedback, graded_by, graded_at, published_at) VALUES
    ('grd-001', 'asm-001', 'stu-001', 78.5, 'Distinction', 1, 'Exceptional AVL tree implementation with thorough amortized analysis and clean memory profiling.', 'Registry Examiner', '2025-11-25T10:00', '2025-11-26T09:00'),
    ('grd-002', 'asm-001', 'stu-006', 64.0, 'Merit', 1, 'Good algorithmic rigor. Minor edge-case omissions in deletion rebalancing.', 'Registry Examiner', '2025-11-25T11:30', '2025-11-26T09:00'),
    ('grd-003', 'asm-002', 'stu-002', 88.0, 'Distinction', 1, 'Outstanding research-grade transformer optimization. Publication-worthy ablation analysis.', 'Registry Examiner', '2025-11-15T14:00', '2025-11-16T10:00'),
    ('grd-004', 'asm-004', 'stu-001', 58.0, 'Pass', 0, 'Solid architectural design. Results withheld pending verification of extenuating circumstances for late submission.', 'Registry Examiner', '2025-11-05T15:00', NULL),
    ('grd-005', 'asm-003', 'stu-004', 72.0, 'Distinction', 1, 'Comprehensive financial ratio triangulation and well-grounded competitive strategy.', 'Registry Examiner', '2025-12-10T11:00', '2025-12-11T09:00'),
    ('grd-006', 'asm-005', 'stu-007', 81.0, 'Distinction', 1, 'Superb Kubernetes deployment with automated health checks and clean GitOps workflow.', 'Registry Examiner', '2025-11-30T10:00', '2025-12-01T09:00'),
    ('grd-007', 'asm-006', 'stu-008', 92.0, 'Distinction', 1, 'Exemplary penetration testing report. Thorough risk classification and actionable remediation steps.', 'Registry Examiner', '2025-11-18T14:30', '2025-11-19T10:00'),
    ('grd-008', 'asm-003', 'stu-009', 66.5, 'Merit', 1, 'Strong strategic analysis with sound application of Porter Five Forces framework.', 'Registry Examiner', '2025-12-10T14:00', '2025-12-11T09:00'),
    ('grd-009', 'asm-005', 'stu-010', 55.0, 'Pass', 1, 'Satisfactory containerization. CI/CD pipeline lacked automated test integration.', 'Registry Examiner', '2025-11-30T12:00', '2025-12-01T09:00'),
    ('grd-010', 'asm-002', 'stu-012', 62.0, 'Merit', 0, 'Competent neural network optimization. Grade withheld pending late submission penalty calculation.', 'Registry Examiner', '2025-11-15T16:00', NULL);
  `);
}

export function resetAndReseed(): void {
  if (!db) return;
  db.run(`
    DROP TABLE IF EXISTS grades;
    DROP TABLE IF EXISTS submissions;
    DROP TABLE IF EXISTS assessments;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS programmes;
  `);
  initializeSchema(db);
  seedInitialData(db);
  saveDatabase();
}
