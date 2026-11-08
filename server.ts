import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getDatabase,
  queryAll,
  queryOne,
  runSql,
  calculateClassification,
  generateNextStudentId,
  resetAndReseed,
  Programme,
  Student,
  Payment,
  Assessment,
  Submission,
  Grade
} from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure database is ready
app.use(async (_req, _res, next) => {
  try {
    await getDatabase();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    next(err);
  }
});

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Registry Overview Stats
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    // Total students & status counts
    const statusCounts = queryAll<{ enrolment_status: string; count: number }>(`
      SELECT enrolment_status, COUNT(*) as count 
      FROM students 
      GROUP BY enrolment_status
    `);

    // Financial totals
    const financialOverview = queryOne<{ total_billed: number }>(`
      SELECT COALESCE(SUM(p.annual_fee), 0) as total_billed
      FROM students s
      JOIN programmes p ON s.programme_id = p.id
    `);

    const paidOverview = queryOne<{ total_paid: number }>(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
    `);

    const totalBilled = financialOverview?.total_billed || 0;
    const totalPaid = paidOverview?.total_paid || 0;
    const totalOutstanding = Math.max(0, totalBilled - totalPaid);

    // Overdue students calculation
    const allStudentsWithBalances = queryAll<{
      id: string;
      annual_fee: number;
      total_paid: number;
      fee_due_date: string;
      enrolment_status: string;
    }>(`
      SELECT s.id, p.annual_fee, 
             COALESCE(SUM(pm.amount), 0) as total_paid,
             s.fee_due_date, s.enrolment_status
      FROM students s
      JOIN programmes p ON s.programme_id = p.id
      LEFT JOIN payments pm ON s.id = pm.student_id
      GROUP BY s.id
    `);

    const todayStr = new Date().toISOString().split('T')[0];
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const stu of allStudentsWithBalances) {
      const balance = stu.annual_fee - stu.total_paid;
      if (balance > 0 && stu.fee_due_date < todayStr && stu.enrolment_status === 'Enrolled') {
        overdueCount++;
        overdueAmount += balance;
      }
    }

    // Assessments & grading counts
    const assessmentStats = queryOne<{ total_assessments: number }>(`
      SELECT COUNT(*) as total_assessments FROM assessments
    `);

    const submissionStats = queryOne<{ total_submissions: number; late_submissions: number }>(`
      SELECT COUNT(*) as total_submissions,
             COALESCE(SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END), 0) as late_submissions
      FROM submissions
    `);

    const gradeStats = queryAll<{ classification: string; count: number }>(`
      SELECT classification, COUNT(*) as count
      FROM grades
      GROUP BY classification
    `);

    const publishStats = queryOne<{ published_count: number; withheld_count: number }>(`
      SELECT 
        COALESCE(SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END), 0) as published_count,
        COALESCE(SUM(CASE WHEN is_published = 0 THEN 1 ELSE 0 END), 0) as withheld_count
      FROM grades
    `);

    res.json({
      students: {
        total: allStudentsWithBalances.length,
        byStatus: statusCounts
      },
      finance: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        collectionRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0,
        overdueCount,
        overdueAmount
      },
      academics: {
        totalAssessments: assessmentStats?.total_assessments || 0,
        totalSubmissions: submissionStats?.total_submissions || 0,
        lateSubmissions: submissionStats?.late_submissions || 0,
        gradeDistribution: gradeStats,
        publishedCount: publishStats?.published_count || 0,
        withheldCount: publishStats?.withheld_count || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Programmes
app.get('/api/programmes', (_req: Request, res: Response) => {
  try {
    const programmes = queryAll<Programme>(`
      SELECT p.*, COUNT(s.id) as student_count 
      FROM programmes p
      LEFT JOIN students s ON p.id = s.programme_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    res.json(programmes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Students - Search & Filter & Real-Time Balance
app.get('/api/students', (req: Request, res: Response) => {
  try {
    const { search, programme_id, status, academic_year, overdue_only } = req.query;

    let sql = `
      SELECT 
        s.id, s.student_id, s.full_name, s.email, s.dob, s.programme_id, 
        s.academic_year, s.enrolment_status, s.fee_due_date, s.created_at,
        p.name as programme_name, p.code as programme_code, p.annual_fee as total_fee,
        COALESCE(SUM(pm.amount), 0) as total_paid
      FROM students s
      JOIN programmes p ON s.programme_id = p.id
      LEFT JOIN payments pm ON s.id = pm.student_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(s.full_name) LIKE ? OR LOWER(s.student_id) LIKE ? OR LOWER(s.email) LIKE ?)`;
      params.push(term, term, term);
    }

    if (programme_id && typeof programme_id === 'string' && programme_id !== 'all') {
      sql += ` AND s.programme_id = ?`;
      params.push(programme_id);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      sql += ` AND s.enrolment_status = ?`;
      params.push(status);
    }

    if (academic_year && typeof academic_year === 'string' && academic_year !== 'all') {
      sql += ` AND s.academic_year = ?`;
      params.push(academic_year);
    }

    sql += ` GROUP BY s.id ORDER BY s.student_id ASC`;

    const rawStudents = queryAll<Student>(sql, params);
    const todayStr = new Date().toISOString().split('T')[0];

    let students = rawStudents.map((st) => {
      const totalFee = Number(st.total_fee) || 0;
      const totalPaid = Number(st.total_paid) || 0;
      const outstanding = Math.max(0, totalFee - totalPaid);
      const isOverdue = outstanding > 0 && st.fee_due_date < todayStr && st.enrolment_status === 'Enrolled';

      return {
        ...st,
        total_fee: totalFee,
        total_paid: totalPaid,
        outstanding_balance: outstanding,
        is_overdue: isOverdue
      };
    });

    if (overdue_only === 'true') {
      students = students.filter((s) => s.is_overdue);
    }

    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Single Student Details (Profile + Ledger + Submissions + Grades)
app.get('/api/students/:id', (req: Request, res: Response) => {
  try {
    const student = queryOne<Student>(`
      SELECT 
        s.*, p.name as programme_name, p.code as programme_code, p.annual_fee as total_fee
      FROM students s
      JOIN programmes p ON s.programme_id = p.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const payments = queryAll<Payment>(`
      SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC
    `, [student.id]);

    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const totalFee = Number(student.total_fee) || 0;
    const outstanding = Math.max(0, totalFee - totalPaid);
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = outstanding > 0 && student.fee_due_date < todayStr && student.enrolment_status === 'Enrolled';

    const submissions = queryAll<Submission>(`
      SELECT sub.*, a.title as assessment_title, a.module_code, a.deadline
      FROM submissions sub
      JOIN assessments a ON sub.assessment_id = a.id
      WHERE sub.student_id = ?
      ORDER BY sub.submitted_at DESC
    `, [student.id]);

    const grades = queryAll<Grade>(`
      SELECT g.*, a.title as assessment_title, a.module_code
      FROM grades g
      JOIN assessments a ON g.assessment_id = a.id
      WHERE g.student_id = ?
      ORDER BY g.graded_at DESC
    `, [student.id]);

    res.json({
      ...student,
      total_paid: totalPaid,
      outstanding_balance: outstanding,
      is_overdue: isOverdue,
      payments,
      submissions,
      grades
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Create Student Record (Auto-generate unique Student ID: SMS-2025-0001)
app.post('/api/students', (req: Request, res: Response) => {
  try {
    const { full_name, email, dob, programme_id, academic_year, enrolment_status, fee_due_date } = req.body;

    if (!full_name || !email || !dob || !programme_id || !academic_year || !enrolment_status) {
      return res.status(400).json({ error: 'Missing required student fields' });
    }

    // Check unique email
    const existing = queryOne(`SELECT id FROM students WHERE LOWER(email) = LOWER(?)`, [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'A student with this email address is already registered' });
    }

    // Programme validation
    const prog = queryOne(`SELECT id FROM programmes WHERE id = ?`, [programme_id]);
    if (!prog) {
      return res.status(400).json({ error: 'Selected programme does not exist' });
    }

    // Extract year from academic_year or current year
    const yearMatch = academic_year.match(/\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    const studentId = generateNextStudentId(year);
    const id = `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const defaultDueDate = fee_due_date || `${year}-10-15`;

    runSql(`
      INSERT INTO students (id, student_id, full_name, email, dob, programme_id, academic_year, enrolment_status, fee_due_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, studentId, full_name.trim(), email.trim(), dob, programme_id, academic_year, enrolment_status, defaultDueDate, now]);

    const createdStudent = queryOne<Student>(`
      SELECT s.*, p.name as programme_name, p.annual_fee as total_fee 
      FROM students s 
      JOIN programmes p ON s.programme_id = p.id 
      WHERE s.id = ?
    `, [id]);

    res.status(201).json(createdStudent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Update Student
app.put('/api/students/:id', (req: Request, res: Response) => {
  try {
    const { full_name, email, dob, programme_id, academic_year, enrolment_status, fee_due_date } = req.body;
    const student = queryOne(`SELECT id FROM students WHERE id = ?`, [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (email) {
      const duplicate = queryOne(`SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND id != ?`, [email.trim(), req.params.id]);
      if (duplicate) {
        return res.status(400).json({ error: 'Another student already uses this email' });
      }
    }

    runSql(`
      UPDATE students 
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          dob = COALESCE(?, dob),
          programme_id = COALESCE(?, programme_id),
          academic_year = COALESCE(?, academic_year),
          enrolment_status = COALESCE(?, enrolment_status),
          fee_due_date = COALESCE(?, fee_due_date)
      WHERE id = ?
    `, [full_name?.trim(), email?.trim(), dob, programme_id, academic_year, enrolment_status, fee_due_date, req.params.id]);

    const updated = queryOne<Student>(`
      SELECT s.*, p.name as programme_name, p.annual_fee as total_fee 
      FROM students s 
      JOIN programmes p ON s.programme_id = p.id 
      WHERE s.id = ?
    `, [req.params.id]);

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Payments - List & Record
app.get('/api/payments', (req: Request, res: Response) => {
  try {
    const { student_id } = req.query;
    let sql = `
      SELECT pm.*, s.student_id as student_code, s.full_name as student_name, p.name as programme_name
      FROM payments pm
      JOIN students s ON pm.student_id = s.id
      JOIN programmes p ON s.programme_id = p.id
    `;
    const params: any[] = [];
    if (student_id && typeof student_id === 'string') {
      sql += ` WHERE pm.student_id = ?`;
      params.push(student_id);
    }
    sql += ` ORDER BY pm.payment_date DESC, pm.created_at DESC`;

    const payments = queryAll<Payment>(sql, params);
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', (req: Request, res: Response) => {
  try {
    const { student_id, amount, payment_date, reference_number, payment_method, notes } = req.body;

    if (!student_id || !amount || !payment_date) {
      return res.status(400).json({ error: 'Missing required payment details (student, amount, date)' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number' });
    }

    const student = queryOne<Student>(`SELECT s.*, p.annual_fee FROM students s JOIN programmes p ON s.programme_id = p.id WHERE s.id = ?`, [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const ref = reference_number?.trim() || `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Check ref uniqueness
    const existingRef = queryOne(`SELECT id FROM payments WHERE reference_number = ?`, [ref]);
    if (existingRef) {
      return res.status(400).json({ error: 'Payment reference number already exists' });
    }

    const id = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(`
      INSERT INTO payments (id, student_id, amount, payment_date, reference_number, payment_method, receipt_status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
    `, [id, student_id, numAmount, payment_date, ref, payment_method || 'Bank Transfer', notes || null, now]);

    const createdPayment = queryOne<Payment>(`
      SELECT pm.*, s.student_id as student_code, s.full_name as student_name
      FROM payments pm
      JOIN students s ON pm.student_id = s.id
      WHERE pm.id = ?
    `, [id]);

    res.status(201).json(createdPayment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Assessments - List & Create
app.get('/api/assessments', (_req: Request, res: Response) => {
  try {
    const assessments = queryAll<Assessment>(`
      SELECT 
        a.*, p.name as programme_name,
        COUNT(DISTINCT sub.id) as submission_count,
        COUNT(DISTINCT g.id) as graded_count
      FROM assessments a
      LEFT JOIN programmes p ON a.programme_id = p.id
      LEFT JOIN submissions sub ON a.id = sub.assessment_id
      LEFT JOIN grades g ON a.id = g.assessment_id
      GROUP BY a.id
      ORDER BY a.deadline ASC
    `);
    res.json(assessments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments', (req: Request, res: Response) => {
  try {
    const { title, module_code, module_name, programme_id, deadline, max_marks, pass_marks, instructions } = req.body;

    if (!title || !module_code || !module_name || !programme_id || !deadline) {
      return res.status(400).json({ error: 'Title, module code, module name, programme, and deadline are required' });
    }

    const id = `asm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(`
      INSERT INTO assessments (id, title, module_code, module_name, programme_id, deadline, max_marks, pass_marks, instructions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      title.trim(),
      module_code.trim().toUpperCase(),
      module_name.trim(),
      programme_id,
      deadline,
      max_marks ? parseFloat(max_marks) : 100,
      pass_marks ? parseFloat(pass_marks) : 40,
      instructions ? instructions.trim() : '',
      now
    ]);

    const created = queryOne<Assessment>(`
      SELECT a.*, p.name as programme_name FROM assessments a LEFT JOIN programmes p ON a.programme_id = p.id WHERE a.id = ?
    `, [id]);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Submissions - One per student per assessment, allow resubmission before deadline, late submission flagged
app.get('/api/submissions', (req: Request, res: Response) => {
  try {
    const { assessment_id, student_id } = req.query;
    let sql = `
      SELECT 
        sub.*, 
        a.title as assessment_title, a.module_code, a.deadline,
        s.student_id as student_code, s.full_name as student_name,
        g.numeric_grade, g.classification, g.is_published
      FROM submissions sub
      JOIN assessments a ON sub.assessment_id = a.id
      JOIN students s ON sub.student_id = s.id
      LEFT JOIN grades g ON (sub.assessment_id = g.assessment_id AND sub.student_id = g.student_id)
      WHERE 1=1
    `;
    const params: any[] = [];
    if (assessment_id && typeof assessment_id === 'string') {
      sql += ` AND sub.assessment_id = ?`;
      params.push(assessment_id);
    }
    if (student_id && typeof student_id === 'string') {
      sql += ` AND sub.student_id = ?`;
      params.push(student_id);
    }
    sql += ` ORDER BY sub.submitted_at DESC`;

    const submissions = queryAll<Submission>(sql, params);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions', (req: Request, res: Response) => {
  try {
    const { assessment_id, student_id, file_name, file_size_kb, file_type, comments } = req.body;

    if (!assessment_id || !student_id || !file_name) {
      return res.status(400).json({ error: 'Assessment, Student, and File name are required' });
    }

    const assessment = queryOne<Assessment>(`SELECT * FROM assessments WHERE id = ?`, [assessment_id]);
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const student = queryOne<Student>(`SELECT * FROM students WHERE id = ?`, [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const now = new Date();
    const submissionTime = now.toISOString();
    const deadlineDate = new Date(assessment.deadline);
    const isLate = now.getTime() > deadlineDate.getTime() ? 1 : 0;

    // Check existing submission
    const existing = queryOne<Submission>(`
      SELECT * FROM submissions WHERE assessment_id = ? AND student_id = ?
    `, [assessment_id, student_id]);

    if (existing) {
      // If already submitted and deadline passed:
      // Per spec: "One submission per student per assessment; allow resubmission before the deadline. Late submissions are accepted but visually flagged."
      const newVersion = (existing.version || 1) + 1;
      runSql(`
        UPDATE submissions
        SET file_name = ?,
            file_size_kb = ?,
            file_type = ?,
            submitted_at = ?,
            is_late = ?,
            version = ?,
            comments = ?
        WHERE id = ?
      `, [
        file_name,
        file_size_kb ? parseFloat(file_size_kb) : 1024,
        file_type || 'PDF',
        submissionTime,
        isLate,
        newVersion,
        comments || existing.comments || '',
        existing.id
      ]);

      const updated = queryOne<Submission>(`SELECT * FROM submissions WHERE id = ?`, [existing.id]);
      return res.json({ ...updated, resubmitted: true, version: newVersion, is_late: isLate });
    }

    // New submission
    const id = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    runSql(`
      INSERT INTO submissions (id, assessment_id, student_id, file_name, file_size_kb, file_type, submitted_at, is_late, version, comments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `, [
      id,
      assessment_id,
      student_id,
      file_name,
      file_size_kb ? parseFloat(file_size_kb) : 1024,
      file_type || 'PDF',
      submissionTime,
      isLate,
      comments || '',
      submissionTime
    ]);

    const created = queryOne<Submission>(`SELECT * FROM submissions WHERE id = ?`, [id]);
    res.status(201).json({ ...created, resubmitted: false, version: 1, is_late: isLate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Grades & Marksheet (Numeric 0-100, Pass >= 40, Merit >= 60, Distinction >= 70, Publish / Withhold toggle)
app.get('/api/grades', (req: Request, res: Response) => {
  try {
    const { assessment_id, student_id, role } = req.query;

    let sql = `
      SELECT 
        g.*,
        a.title as assessment_title, a.module_code, a.module_name, a.max_marks,
        s.student_id as student_code, s.full_name as student_name, s.email as student_email,
        sub.submitted_at, sub.file_name, sub.is_late
      FROM grades g
      JOIN assessments a ON g.assessment_id = a.id
      JOIN students s ON g.student_id = s.id
      LEFT JOIN submissions sub ON (g.assessment_id = sub.assessment_id AND g.student_id = sub.student_id)
      WHERE 1=1
    `;
    const params: any[] = [];

    if (assessment_id && typeof assessment_id === 'string') {
      sql += ` AND g.assessment_id = ?`;
      params.push(assessment_id);
    }
    if (student_id && typeof student_id === 'string') {
      sql += ` AND g.student_id = ?`;
      params.push(student_id);
    }

    // If role is student, only return published grades! Or indicate withheld
    const isStudent = role === 'student';

    sql += ` ORDER BY g.graded_at DESC`;
    let grades = queryAll<Grade>(sql, params);

    if (isStudent) {
      grades = grades.map((g) => {
        if (g.is_published === 0) {
          return {
            ...g,
            numeric_grade: -1, // Hidden
            classification: 'Fail' as const, // placeholder
            feedback: 'Official results for this assessment are withheld by the Registry pending moderation.',
            is_withheld: true
          };
        }
        return g;
      });
    }

    res.json(grades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/grades', (req: Request, res: Response) => {
  try {
    const { assessment_id, student_id, numeric_grade, is_published, feedback, graded_by } = req.body;

    if (!assessment_id || !student_id || numeric_grade === undefined || numeric_grade === null) {
      return res.status(400).json({ error: 'Assessment, Student, and Numeric Grade are required' });
    }

    const gradeNum = parseFloat(numeric_grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return res.status(400).json({ error: 'Grade must be a numeric value between 0 and 100' });
    }

    const classification = calculateClassification(gradeNum);
    const now = new Date().toISOString();
    const published = is_published ? 1 : 0;
    const publishedAt = published === 1 ? now : null;

    // Check existing grade
    const existing = queryOne<Grade>(`
      SELECT id FROM grades WHERE assessment_id = ? AND student_id = ?
    `, [assessment_id, student_id]);

    if (existing) {
      runSql(`
        UPDATE grades
        SET numeric_grade = ?,
            classification = ?,
            is_published = ?,
            feedback = ?,
            graded_by = ?,
            graded_at = ?,
            published_at = COALESCE(?, published_at)
        WHERE id = ?
      `, [
        gradeNum,
        classification,
        published,
        feedback || '',
        graded_by || 'Registry Examiner',
        now,
        publishedAt,
        existing.id
      ]);

      const updated = queryOne<Grade>(`SELECT * FROM grades WHERE id = ?`, [existing.id]);
      return res.json(updated);
    }

    const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    runSql(`
      INSERT INTO grades (id, assessment_id, student_id, numeric_grade, classification, is_published, feedback, graded_by, graded_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      assessment_id,
      student_id,
      gradeNum,
      classification,
      published,
      feedback || '',
      graded_by || 'Registry Examiner',
      now,
      publishedAt
    ]);

    const created = queryOne<Grade>(`SELECT * FROM grades WHERE id = ?`, [id]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle publish / withhold status
app.patch('/api/grades/:id/publish', (req: Request, res: Response) => {
  try {
    const { is_published } = req.body;
    const grade = queryOne<Grade>(`SELECT * FROM grades WHERE id = ?`, [req.params.id]);
    if (!grade) {
      return res.status(404).json({ error: 'Grade record not found' });
    }

    const publishVal = is_published !== undefined ? (is_published ? 1 : 0) : (grade.is_published === 1 ? 0 : 1);
    const publishedAt = publishVal === 1 ? new Date().toISOString() : null;

    runSql(`
      UPDATE grades 
      SET is_published = ?,
          published_at = ?
      WHERE id = ?
    `, [publishVal, publishedAt, req.params.id]);

    const updated = queryOne<Grade>(`SELECT * FROM grades WHERE id = ?`, [req.params.id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch publish/withhold by assessment
app.post('/api/assessments/:id/publish-all', (req: Request, res: Response) => {
  try {
    const { publish } = req.body;
    const publishVal = publish === false ? 0 : 1;
    const now = publishVal === 1 ? new Date().toISOString() : null;

    runSql(`
      UPDATE grades
      SET is_published = ?,
          published_at = ?
      WHERE assessment_id = ?
    `, [publishVal, now, req.params.id]);

    res.json({ success: true, assessment_id: req.params.id, is_published: publishVal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Database Reset & Reseed
app.post('/api/seed/reset', (_req: Request, res: Response) => {
  try {
    resetAndReseed();
    res.json({ success: true, message: 'Database reset and re-seeded with demo data' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Prisma & Next.js Export payload (for local git repo / Vercel submission)
app.get('/api/export/schema', (_req: Request, res: Response) => {
  const prismaSchema = `// prisma/schema.prisma
// PEN Global Technical Assessment - Student Management System

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // or "sqlite" for local testing: env("DATABASE_URL")
  url      = env("DATABASE_URL")
}

enum EnrolmentStatus {
  Enrolled
  Deferred
  Withdrawn
  Completed
}

enum GradeClassification {
  Fail
  Pass
  Merit
  Distinction
}

model Programme {
  id            String       @id @default(uuid())
  code          String       @unique
  name          String
  department    String
  annualFee     Decimal      @db.Decimal(10, 2)
  durationYears Int          @default(3)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  students      Student[]
  assessments   Assessment[]

  @@map("programmes")
}

model Student {
  id              String          @id @default(uuid())
  studentId       String          @unique // e.g. SMS-2025-0001
  fullName        String
  email           String          @unique
  dob             DateTime
  programmeId     String
  programme       Programme       @relation(fields: [programmeId], references: [id], onDelete: Restrict)
  academicYear    String          // e.g. 2025/2026
  enrolmentStatus EnrolmentStatus @default(Enrolled)
  feeDueDate      DateTime
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  payments        Payment[]
  submissions     Submission[]
  grades          Grade[]

  @@index([enrolmentStatus])
  @@index([programmeId])
  @@map("students")
}

model Payment {
  id              String   @id @default(uuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  amount          Decimal  @db.Decimal(10, 2)
  paymentDate     DateTime
  referenceNumber String   @unique // e.g. PAY-2025-8801
  paymentMethod   String   @default("Bank Transfer")
  receiptStatus   String   @default("Confirmed")
  notes           String?
  createdAt       DateTime @default(now())

  @@index([studentId])
  @@map("payments")
}

model Assessment {
  id           String       @id @default(uuid())
  title        String
  moduleCode   String
  moduleName   String
  programmeId  String
  programme    Programme    @relation(fields: [programmeId], references: [id], onDelete: Restrict)
  deadline     DateTime
  maxMarks     Decimal      @default(100.00) @db.Decimal(5, 2)
  passMarks    Decimal      @default(40.00) @db.Decimal(5, 2)
  instructions String?      @db.Text
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  submissions  Submission[]
  grades       Grade[]

  @@index([programmeId])
  @@map("assessments")
}

model Submission {
  id           String     @id @default(uuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  studentId    String
  student      Student    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  fileName     String
  fileSizeKb   Decimal    @db.Decimal(8, 2)
  fileType     String     // PDF, DOCX
  submittedAt  DateTime   @default(now())
  isLate       Boolean    @default(false)
  version      Int        @default(1)
  comments     String?    @db.Text
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([assessmentId, studentId])
  @@index([assessmentId])
  @@index([studentId])
  @@map("submissions")
}

model Grade {
  id             String              @id @default(uuid())
  assessmentId   String
  assessment     Assessment          @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  studentId      String
  student        Student             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  numericGrade   Decimal             @db.Decimal(5, 2)
  classification GradeClassification // Pass >= 40, Merit >= 60, Distinction >= 70
  isPublished    Boolean             @default(false)
  feedback       String?             @db.Text
  gradedBy       String              @default("Registry Examiner")
  gradedAt       DateTime            @default(now())
  publishedAt    DateTime?
  updatedAt      DateTime            @updatedAt

  @@unique([assessmentId, studentId])
  @@index([assessmentId])
  @@index([studentId])
  @@map("grades")
}
`;
  res.json({ prismaSchema });
});

// Setup Vite in Dev or Static Serving in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PEN Global SMS Registry server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
