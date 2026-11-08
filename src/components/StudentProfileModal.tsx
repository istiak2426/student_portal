import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  FileCheck,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock
} from 'lucide-react';
import { Student, Payment, Submission, Grade } from '../types';
import { fetchStudentDetails } from '../api';

interface StudentProfileModalProps {
  studentId: string | null;
  onClose: () => void;
  onOpenRecordPayment: (studentId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
  onOpenRecordPayment,
}) => {
  const [studentData, setStudentData] = useState<(Student & {
    payments: Payment[];
    submissions: Submission[];
    grades: Grade[];
  }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setIsLoading(true);
    fetchStudentDetails(studentId)
      .then((data) => setStudentData(data))
      .catch((err) => console.error('Failed to load student record:', err))
      .finally(() => setIsLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-xs uppercase font-mono font-semibold tracking-wider text-emerald-400">
              Student Profile
            </div>
            <h3 className="text-lg font-bold mt-0.5">
              {studentData?.full_name || 'Loading...'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Loading student record...
            </div>
          ) : studentData ? (
            <>
              {/* Profile Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Student ID:</span>
                  <span className="font-mono font-bold text-slate-900">{studentData.student_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <span className="font-semibold text-emerald-800">{studentData.enrolment_status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth:</span>
                  <span className="font-mono text-slate-800">{studentData.dob}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Academic Year:</span>
                  <span className="font-mono text-slate-800">{studentData.academic_year}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Email Address:</span>
                  <span className="font-mono text-slate-800">{studentData.email}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Degree Programme:</span>
                  <span className="font-semibold text-slate-900">{studentData.programme_name}</span>
                </div>
              </div>

              {/* Fees Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    Tuition Fees & Payments
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecordPayment(studentData.id);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    + Record Payment
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500">Total Tuition</span>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                      £{(studentData.total_fee || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Amount Paid</span>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                      £{(studentData.total_paid || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Balance</span>
                    <div className="text-sm font-bold font-mono mt-0.5">
                      {studentData.outstanding_balance === 0 ? (
                        <span className="text-emerald-700">£0.00</span>
                      ) : (
                        <span className={studentData.is_overdue ? 'text-rose-700' : 'text-slate-900'}>
                          £{(studentData.outstanding_balance || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Reference</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Method</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentData.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2 font-mono font-medium">{p.reference_number}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono">{p.payment_date}</td>
                          <td className="px-3 py-2 text-slate-600">{p.payment_method}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            £{p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {studentData.payments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            No payments recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submissions & Grades */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  Assessments & Grades
                </h4>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Assessment</th>
                        <th className="px-3 py-2">File</th>
                        <th className="px-3 py-2 text-right">Grade</th>
                        <th className="px-3 py-2">Classification</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentData.grades.map((g) => (
                        <tr key={g.id}>
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900">{g.assessment_title}</div>
                            <div className="font-mono text-emerald-800 text-[10px]">{g.module_code}</div>
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                            {studentData.submissions.find(s => s.assessment_id === g.assessment_id)?.file_name || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            {g.numeric_grade.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {g.classification}
                          </td>
                          <td className="px-3 py-2">
                            {g.is_published === 1 ? (
                              <span className="text-emerald-700 font-semibold">Published</span>
                            ) : (
                              <span className="text-amber-700 font-semibold">Withheld</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {studentData.grades.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No graded assessments on file
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
