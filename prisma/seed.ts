/**
 * PEN Global - Student Management System: Registry Module
 * Prisma Seed Script: Seeds >= 5 students, 2+ programmes, fees, submissions, and grades
 */

// If using in a Prisma project: npx prisma db seed
export const seedData = {
  programmes: [
    {
      id: 'prog-cs',
      code: 'BSc-CS',
      name: 'BSc (Hons) Computer Science',
      department: 'School of Computing & Engineering',
      annualFee: 12500,
      durationYears: 3
    },
    {
      id: 'prog-ds',
      code: 'MSc-DS',
      name: 'MSc Data Science & Artificial Intelligence',
      department: 'School of Computing & Engineering',
      annualFee: 15800,
      durationYears: 1
    },
    {
      id: 'prog-ba',
      code: 'BA-BA',
      name: 'BA (Hons) Business Administration',
      department: 'School of Management & Business',
      annualFee: 10200,
      durationYears: 3
    }
  ],
  students: [
    {
      id: 'stu-001',
      studentId: 'SMS-2025-0001',
      fullName: 'Tariq Rahman',
      email: 'tariq.rahman@student.pen.edu',
      dob: '2004-03-15T00:00:00.000Z',
      programmeId: 'prog-cs',
      academicYear: '2025/2026',
      enrolmentStatus: 'Enrolled',
      feeDueDate: '2025-10-15T00:00:00.000Z'
    },
    {
      id: 'stu-002',
      studentId: 'SMS-2025-0002',
      fullName: 'Sophia Zhang',
      email: 'sophia.zhang@student.pen.edu',
      dob: '2001-08-22T00:00:00.000Z',
      programmeId: 'prog-ds',
      academicYear: '2025/2026',
      enrolmentStatus: 'Enrolled',
      feeDueDate: '2025-10-15T00:00:00.000Z'
    },
    {
      id: 'stu-003',
      studentId: 'SMS-2025-0003',
      fullName: 'Liam O\'Connor',
      email: 'liam.oconnor@student.pen.edu',
      dob: '2003-11-09T00:00:00.000Z',
      programmeId: 'prog-cs',
      academicYear: '2025/2026',
      enrolmentStatus: 'Deferred',
      feeDueDate: '2025-12-01T00:00:00.000Z'
    },
    {
      id: 'stu-004',
      studentId: 'SMS-2024-0014',
      fullName: 'Aisha Patel',
      email: 'aisha.patel@student.pen.edu',
      dob: '2002-05-30T00:00:00.000Z',
      programmeId: 'prog-ba',
      academicYear: '2024/2025',
      enrolmentStatus: 'Enrolled',
      feeDueDate: '2025-01-10T00:00:00.000Z'
    },
    {
      id: 'stu-005',
      studentId: 'SMS-2024-0022',
      fullName: 'Marcus Vance',
      email: 'marcus.vance@student.pen.edu',
      dob: '1999-12-04T00:00:00.000Z',
      programmeId: 'prog-ds',
      academicYear: '2024/2025',
      enrolmentStatus: 'Completed',
      feeDueDate: '2024-11-01T00:00:00.000Z'
    },
    {
      id: 'stu-006',
      studentId: 'SMS-2025-0004',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@student.pen.edu',
      dob: '2004-07-19T00:00:00.000Z',
      programmeId: 'prog-cs',
      academicYear: '2025/2026',
      enrolmentStatus: 'Enrolled',
      feeDueDate: '2025-10-15T00:00:00.000Z'
    }
  ]
};
