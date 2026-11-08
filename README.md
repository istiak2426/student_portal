# PEN Global Student Management System — Registry Module

**Technical Assessment Submission**  
Concern of PEN Group | Information Technology Team  
Candidate Submission: Student Management System (Registry Module)

---

## 1. Overview & Business Understanding (30%)

The Registry is the administrative backbone of higher education institutions. This module covers the four mission-critical daily workflows of a Registry Administrator:

1. **Student Enrolment**: Creation and lifecycle management of student records with auto-generated formatted student identifiers (`SMS-YYYY-NNNN`), strict email deduplication, and cross-attribute search and filtering (by name, ID, programme, and status).
2. **Fees & Payments**: Automated assignment of programme tuition structures, real-time recalculation of student balances on every transaction, multi-channel payment logging with immutable reference tracking, and prominent overdue risk flags for administrative intervention.
3. **Assessment Management & Submissions**: Academic workflow allowing staff to establish module deadlines and requirements. Students submit coursework files (PDF/DOCX) with automatic versioning for pre-deadline resubmissions, and timestamp-based late flags for audit compliance.
4. **Marksheet & Result Moderation**: Numeric grading (0–100) mapped to standard British university honours classifications (Distinction $\ge 70$, Merit $\ge 60$, Pass $\ge 40$, Fail $< 40$). Granular publish/withhold controls safeguard unmoderated marks, ensuring students only view finalized registry-approved transcripts.

---

## 2. Feature Intuition & Edge Case Handling (30%)

| Edge Case | Problem in Naive Implementations | Solution Implemented in this SMS |
|---|---|---|
| **Overdue Balances** | Simple balance check doesn't account for due dates or non-enrolled students. | Registry dashboard cross-references `feeDueDate < Current Date` AND `outstandingBalance > 0` specifically for active `Enrolled` students, preventing false flags on deferred or completed alumni. |
| **Assessment Resubmissions** | Students re-uploading file could create orphaned duplicates or crash foreign keys. | Pre-deadline uploads gracefully update the existing submission, incrementing an explicit `version` field (e.g. `v1 -> v2`) and updating the audit log. |
| **Late Submissions** | Hard deadlines either block students completely or silently accept late work. | Accepts late submissions but calculates time delta and visually tags the record with an amber/crimson `Late Submission` audit flag for registry deduction review. |
| **Result Withholding** | Students viewing raw unmoderated grades before external examiners meet. | Explicit `isPublished` Boolean per student mark. In Student View, unverified marks are hidden and rendered with "Grade Withheld - Registry Moderation" notice. |
| **Student ID Sequential Collisions** | Concurrency or duplicate IDs when generating sequences. | Auto-queries highest sequential identifier within the current academic intake year (`SMS-2025-0001`, `0002`...) guaranteeing sequential integrity. |

---

## 3. Technical Architecture & Database Design (25%)

### Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend API**: Node.js & Express RESTful API with parameter sanitization and HTTP status contracts
- **Database**: SQLite (via `sql.js` WebAssembly engine with file persistence) + Production Prisma ORM PostgreSQL schema (`prisma/schema.prisma`)
- **Deployment**: Live Cloud Preview + 1-Click Vercel / GitHub deployment structure

### Database Schema Entity Relationships
```
Programme (1) ──────────< Student (Many) ──────────< Payment (Many)
     │                         │                          
     │                         ├──────────────────────────< Submission (Many)
     │                         │                                  │
     └──────< Assessment (1) ──┴──────────────────────────< Grade (1:1 per student)
```

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- npm or pnpm

### Quickstart
```bash
# 1. Clone the repository
git clone <your-github-repo-url>
cd sms-registry-module

# 2. Install dependencies
npm install

# 3. Environment Configuration
cp .env.example .env

# 4. Start the Full-Stack Application (runs API + UI)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Seeding
The application automatically bootstraps and seeds 6 realistic student records, 3 degree programmes, fee ledgers, assessments, late/on-time submissions, and published/withheld grades upon first boot. You can also click the **"Reset & Reseed Demo Data"** button in the UI header at any time.

---

## 5. Environment Variables (`.env.example`)
```env
# Application Port
PORT=3000

# Database URL (For Prisma ORM with PostgreSQL or SQLite)
DATABASE_URL="postgresql://user:password@localhost:5432/sms_registry?schema=public"
# Or SQLite:
# DATABASE_URL="file:./sms_registry.sqlite"

# Node Environment
NODE_ENV="development"
```

---

## 6. AI Usage During the Build (15%)

In accordance with PEN Group assessment guidelines:
- **Architectural Schema Design**: AI assisted in drafting the relational PostgreSQL schema and Prisma ORM models to enforce strict foreign key constraints between programmes, students, payments, submissions, and grades.
- **Workflow State Machine Optimization**: AI helped model the edge cases around assessment submissions: transitioning between draft, on-time submission, pre-deadline resubmission (versioning), and post-deadline late flagging.
- **Automated Synthetic Testing**: AI generated edge-case test vectors including boundary grades (39 Fail vs 40 Pass, 59 Pass vs 60 Merit, 69 Merit vs 70 Distinction) and overdue fee calculation matrices to verify UI alerting.
- **Human Curation**: All business logic, UI hierarchy, registry role separation, and aesthetic styling were deliberately structured to conform strictly to realistic higher education administrative standards.
