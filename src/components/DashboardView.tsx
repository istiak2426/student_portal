import React from 'react';
import {
  Users,
  CreditCard,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { RegistryStats, Student, Submission, Assessment } from '../types';

interface DashboardViewProps {
  stats: RegistryStats | null;
  students: Student[];
  submissions: Submission[];
  assessments: Assessment[];
  onNavigateTab: (tab: string) => void;
  onOpenRecordPayment: (studentId?: string) => void;
  onViewStudentProfile: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  students,
  submissions,
  assessments,
  onNavigateTab,
  onOpenRecordPayment,
  onViewStudentProfile,
}) => {
  const overdueStudents = students.filter((s) => s.is_overdue);

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Registry Office
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Student Management Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage student records, track tuition payments, review assignment submissions, and publish grades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('enrolment')}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Add Student
          </button>
          <button
            type="button"
            onClick={() => onOpenRecordPayment()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-emerald-700" />
            Record Payment
          </button>
        </div>
      </div>

      {/* 4 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Enrolled Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.students.total ?? students.length}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{students.filter(s => s.enrolment_status === 'Enrolled').length} Enrolled</span>
              <span>·</span>
              <span>{students.filter(s => s.enrolment_status === 'Deferred').length} Deferred</span>
              <span>·</span>
              <span>{students.filter(s => s.enrolment_status === 'Completed').length} Completed</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('enrolment')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 hover:text-emerald-800 font-medium"
          >
            <span>View All Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Tuition Collection */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Fees Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              £{(stats?.finance.totalPaid ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="font-semibold text-emerald-600 font-mono tabular-nums">
                {stats?.finance.collectionRate ?? 0}%
              </span>
              <span>of £{(stats?.finance.totalBilled ?? 0).toLocaleString()} total billed</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('fees')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 hover:text-blue-800 font-medium"
          >
            <span>View Payment Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Overdue Balances Flag */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Overdue Fees
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-700">
              £{(stats?.finance.overdueAmount ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span className="font-semibold text-rose-600 font-mono tabular-nums">
                {stats?.finance.overdueCount ?? overdueStudents.length} Students
              </span>
              <span>past payment deadline</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('fees')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-rose-700 hover:text-rose-800 font-medium"
          >
            <span>View Overdue Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Academic Submissions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Coursework Submissions
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.academics.totalSubmissions ?? submissions.length}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="text-amber-600 font-mono tabular-nums font-semibold">
                {stats?.academics.lateSubmissions ?? 0} Late
              </span>
              <span>·</span>
              <span>{stats?.academics.publishedCount ?? 0} Published</span>
              <span>·</span>
              <span>{stats?.academics.withheldCount ?? 0} Withheld</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('marksheet')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-700 hover:text-purple-800 font-medium"
          >
            <span>View Grades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overdue Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h2 className="text-base font-semibold text-slate-900">
                Overdue Student Accounts
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Students with unpaid tuition fees past their payment deadline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('fees')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Fee Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {overdueStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">All student accounts are in good standing.</p>
            <p className="text-xs text-slate-500 mt-1">No overdue tuition payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Programme</th>
                  <th className="px-6 py-3 text-right">Total Fee</th>
                  <th className="px-6 py-3 text-right">Paid</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3">Payment Due Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <button
                        type="button"
                        onClick={() => onViewStudentProfile(s.id)}
                        className="text-left group"
                      >
                        <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {s.full_name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {s.student_id} · {s.email}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{s.programme_name}</div>
                      <div className="text-slate-400 font-mono">{s.programme_code}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-700">
                      £{(s.total_fee || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-emerald-700">
                      £{(s.total_paid || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="font-mono tabular-nums font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        £{(s.outstanding_balance || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono tabular-nums text-slate-600">
                      {s.fee_due_date}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenRecordPayment(s.id)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200 shadow-2xs whitespace-nowrap"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Assessments & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Assessments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  Coursework Assessments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submission deadlines and received coursework
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('assessments')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                + New Assessment
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {assessments.slice(0, 3).map((a) => (
                <div key={a.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono font-medium text-emerald-800">
                      {a.module_code}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Deadline: {new Date(a.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono tabular-nums font-semibold text-slate-800">
                      {a.submission_count ?? 0} Submissions
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {a.graded_count ?? 0} Graded
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('assessments')}
            className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <span>View All Assessments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Marksheet & Results */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Student Grades & Results
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grade classifications and publishing status
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('marksheet')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                Enter Grades
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-xs font-medium text-emerald-800">Distinction</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-900 mt-1">
                    {stats?.academics.gradeDistribution.find(g => g.classification === 'Distinction')?.count || 0}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">≥ 70%</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-xs font-medium text-blue-800">Merit</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-blue-900 mt-1">
                    {stats?.academics.gradeDistribution.find(g => g.classification === 'Merit')?.count || 0}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-0.5">≥ 60%</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-xs font-medium text-amber-800">Pass</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-amber-900 mt-1">
                    {stats?.academics.gradeDistribution.find(g => g.classification === 'Pass')?.count || 0}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">≥ 40%</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <div className="text-xs font-medium text-rose-800">Fail</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-rose-900 mt-1">
                    {stats?.academics.gradeDistribution.find(g => g.classification === 'Fail')?.count || 0}
                  </div>
                  <div className="text-[10px] text-rose-700 mt-0.5">&lt; 40%</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs mt-3">
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-800">
                    Withheld Results: {stats?.academics.withheldCount ?? 0}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Grades are hidden from students until published by staff.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab('marksheet')}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Manage Grades
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('marksheet')}
            className="w-full mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5"
          >
            <span>Open Grades & Marksheets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
