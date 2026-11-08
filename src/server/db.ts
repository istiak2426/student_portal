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
  
  // Programmes
  database.run(`
    INSERT OR REPLACE INTO programmes (id, code, name, department, annual_fee, duration_years, created_at) VALUES
    ('prog-cs', 'BSc-CS', 'BSc (Hons) Computer Science', 'School of Computing & Engineering', 12500, 3, '${now}'),
    ('prog-ds', 'MSc-DS', 'MSc Data Science & Artificial Intelligence', 'School of Computing & Engineering', 15800, 1, '${now}'),
    ('prog-ba', 'BA-BA', 'BA (Hons) Business Administration', 'School of Management & Business', 10200, 3, '${now}');
  `);

  // 6 Diverse Students with realistic Registry workflows
  database.run(`
    INSERT OR REPLACE INTO students (id, student_id, full_name, email, dob, programme_id, academic_year, enrolment_status, fee_due_date, created_at) VALUES
    ('stu-001', 'SMS-2025-0001', 'Tariq Rahman', 'tariq.rahman@student.pen.edu', '2004-03-15', 'prog-cs', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-002', 'SMS-2025-0002', 'Sophia Zhang', 'sophia.zhang@student.pen.edu', '2001-08-22', 'prog-ds', '2025/2026', 'Enrolled', '2025-10-15', '${now}'),
    ('stu-003', 'SMS-2025-0003', 'Liam O''Connor', 'liam.oconnor@student.pen.edu', '2003-11-09', 'prog-cs', '2025/2026', 'Deferred', '2025-12-01', '${now}'),
    ('stu-004', 'SMS-2024-0014', 'Aisha Patel', 'aisha.patel@student.pen.edu', '2002-05-30', 'prog-ba', '2024/2025', 'Enrolled', '2025-01-10', '${now}'),
    ('stu-005', 'SMS-2024-0022', 'Marcus Vance', 'marcus.vance@student.pen.edu', '1999-12-04', 'prog-ds', '2024/2025', 'Completed', '2024-11-01', '${now}'),
    ('stu-006', 'SMS-2025-0004', 'Elena Rostova', 'elena.rostova@student.pen.edu', '2004-07-19', 'prog-cs', '2025/2026', 'Enrolled', '2025-10-15', '${now}');
  `);

  // Fee Payments
  // Tariq: £12500 fee, paid £8000 -> £4500 outstanding (Overdue)
  // Sophia: £15800 fee, paid £15800 -> £0 outstanding (Paid in Full)
  // Liam: £12500 fee, paid £3000 -> £9500 outstanding (Deferred)
  // Aisha: £10200 fee, paid £5000 -> £5200 outstanding (Overdue)
  // Marcus: £15800 fee, paid £15800 -> £0 outstanding (Completed)
  // Elena: £12500 fee, paid £12500 -> £0 outstanding (Paid in Full)
  database.run(`
    INSERT OR REPLACE INTO payments (id, student_id, amount, payment_date, reference_number, payment_method, receipt_status, notes, created_at) VALUES
    ('pay-001', 'stu-001', 5000, '2025-09-12', 'PAY-2025-8801', 'Bank Transfer', 'Confirmed', 'Term 1 Initial Tuition Instalment', '${now}'),
    ('pay-002', 'stu-001', 3000, '2025-10-20', 'PAY-2025-8842', 'Credit Card', 'Confirmed', 'Term 1 Mid Instalment', '${now}'),
    ('pay-003', 'stu-002', 15800, '2025-09-05', 'PAY-2025-7719', 'Bank Transfer', 'Confirmed', 'Full Postgraduate Tuition Fee upfront', '${now}'),
    ('pay-004', 'stu-003', 3000, '2025-09-15', 'PAY-2025-6602', 'Direct Debit', 'Confirmed', 'Enrolment Deposit', '${now}'),
    ('pay-005', 'stu-004', 5000, '2024-10-02', 'PAY-2024-4411', 'Bank Transfer', 'Confirmed', 'First Instalment 2024/25', '${now}'),
    ('pay-006', 'stu-005', 8000, '2024-09-10', 'PAY-2024-3301', 'Bank Transfer', 'Confirmed', 'Term 1 Tuition', '${now}'),
    ('pay-007', 'stu-005', 7800, '2025-01-14', 'PAY-2025-1109', 'Bank Transfer', 'Confirmed', 'Term 2 Final Settlement', '${now}'),
    ('pay-008', 'stu-006', 12500, '2025-09-08', 'PAY-2025-9921', 'Credit Card', 'Confirmed', 'Full Undergraduate Tuition Payment', '${now}');
  `);

  // Assessments
  database.run(`
    INSERT OR REPLACE INTO assessments (id, title, module_code, module_name, programme_id, deadline, max_marks, pass_marks, instructions, created_at) VALUES
    ('asm-001', 'Algorithms & Data Structures Coursework', 'CS102', 'Algorithms & Data Structures', 'prog-cs', '2025-11-20T23:59', 100, 40, 'Implement balanced AVL search trees and write a benchmarking report comparing O(log n) operations against hash tables. Submit as PDF or DOCX.', '${now}'),
    ('asm-002', 'Deep Learning Model Optimization Project', 'DS501', 'Applied Neural Networks', 'prog-ds', '2025-11-10T17:00', 100, 40, 'Train and evaluate a transformer architecture on custom domain data with ablation studies and hyperparameter logs.', '${now}'),
    ('asm-003', 'Corporate Strategic Analysis Report', 'BA304', 'Strategic Management', 'prog-ba', '2025-12-05T12:00', 100, 40, 'Comprehensive strategic analysis of an international market entrant using Porter Five Forces, VRIO, and financial ratios.', '${now}'),
    ('asm-004', 'Software Engineering Architecture Specification', 'CS105', 'Software Architecture', 'prog-cs', '2025-10-30T18:00', 100, 40, 'System design document including C4 architecture diagrams and REST API schema contracts.', '${now}');
  `);

  // Submissions (including on-time, late submission, and resubmitted v2)
  database.run(`
    INSERT OR REPLACE INTO submissions (id, assessment_id, student_id, file_name, file_size_kb, file_type, submitted_at, is_late, version, comments, created_at) VALUES
    ('sub-001', 'asm-001', 'stu-001', 'Tariq_Rahman_CS102_Coursework_v2.pdf', 1420.5, 'PDF', '2025-11-19T14:30', 0, 2, 'Revised benchmark charts as per lab feedback.', '${now}'),
    ('sub-002', 'asm-001', 'stu-006', 'Elena_Rostova_CS102_Coursework.pdf', 980.2, 'PDF', '2025-11-20T19:45', 0, 1, 'Final submission with full code repository appendix.', '${now}'),
    ('sub-003', 'asm-002', 'stu-002', 'Sophia_Zhang_DS501_Project.pdf', 3450.8, 'PDF', '2025-11-09T11:15', 0, 1, 'Includes PyTorch checkpoints evaluation metrics and ROC curves.', '${now}'),
    ('sub-004', 'asm-004', 'stu-001', 'Tariq_Rahman_CS105_LateSubmission.docx', 1150.0, 'DOCX', '2025-10-31T09:12', 1, 1, 'Submitted 15 hours late due to medical extenuating circumstance application pending.', '${now}'),
    ('sub-005', 'asm-003', 'stu-004', 'Aisha_Patel_BA304_Report.pdf', 2100.4, 'PDF', '2025-12-04T16:20', 0, 1, 'Case study on fintech market entry in Southeast Asia.', '${now}');
  `);

  // Grades (including Distinction, Merit, Pass, and Withheld results)
  database.run(`
    INSERT OR REPLACE INTO grades (id, assessment_id, student_id, numeric_grade, classification, is_published, feedback, graded_by, graded_at, published_at) VALUES
    ('grd-001', 'asm-001', 'stu-001', 78.5, 'Distinction', 1, 'Exceptional AVL tree implementation with thorough amortized analysis and clean memory profiling.', 'Dr. Elizabeth Thorne, Head of Registry Assessments', '2025-11-25T10:00', '2025-11-26T09:00'),
    ('grd-002', 'asm-001', 'stu-006', 64.0, 'Merit', 1, 'Good algorithmic rigor. Minor edge-case omissions in deletion rebalancing.', 'Dr. Elizabeth Thorne, Head of Registry Assessments', '2025-11-25T11:30', '2025-11-26T09:00'),
    ('grd-003', 'asm-002', 'stu-002', 88.0, 'Distinction', 1, 'Outstanding research-grade transformer optimization. Publication-worthy ablation analysis.', 'Prof. Julian Davies, AI Lead', '2025-11-15T14:00', '2025-11-16T10:00'),
    ('grd-004', 'asm-004', 'stu-001', 58.0, 'Pass', 0, 'Solid architectural design. Results currently withheld pending Registry verification of extenuating circumstances for late penalty deduction.', 'Registry Moderation Panel', '2025-11-05T15:00', NULL),
    ('grd-005', 'asm-003', 'stu-004', 72.0, 'Distinction', 1, 'Comprehensive financial ratio triangulation and well-grounded competitive strategy.', 'Dr. Alan Miller, Management Chair', '2025-12-10T11:00', '2025-12-11T09:00');
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
