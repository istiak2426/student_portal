import React, { useState } from 'react';
import {
  GraduationCap,
  CreditCard,
  FileCheck,
  Award,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Student, Payment, Assessment, Submission, Grade } from '../types';

interface StudentPortalViewProps {
  currentStudent: Student | null;
  allStudents: Student[];
  onSelectStudent: (id: string) => void;
  payments: Payment[];
  assessments: Assessment[];
  submissions: Submission[];
  grades: Grade[];
  onSubmitWork: (data: {
    assessment_id: string;
    student_id: string;
    file_name: string;
    file_size_kb?: number;
    file_type?: string;
    comments?: string;
  }) => Promise<void>;
  onRecordPayment: (data: {
    student_id: string;
    amount: number;
    payment_date: string;
    reference_number?: string;
    payment_method?: string;
    notes?: string;
  }) => Promise<void>;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentStudent,
  allStudents,
  onSelectStudent,
  payments,
  assessments,
  submissions,
  grades,
  onSubmitWork,
  onRecordPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'assessments' | 'marksheet' | 'fees'>('assessments');
  const [selectedAssessmentForUpload, setSelectedAssessmentForUpload] = useState<Assessment | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [studentComments, setStudentComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Student Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [isPaying, setIsPaying] = useState(false);

  if (!currentStudent) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p>No student profile selected. Please select a student from the dropdown.</p>
      </div>
    );
  }

  const myPayments = payments.filter((p) => p.student_id === currentStudent.id);
  const mySubmissions = submissions.filter((s) => s.student_id === currentStudent.id);
  const myGrades = grades.filter((g) => g.student_id === currentStudent.id);

  const myAssessments = assessments.filter(
    (a) => a.programme_id === currentStudent.programme_id
  );

  const now = new Date();

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentForUpload || !fileName.trim()) {
      setUploadError('Please specify the file name for your submission.');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadError(null);
      await onSubmitWork({
        assessment_id: selectedAssessmentForUpload.id,
        student_id: currentStudent.id,
        file_name: fileName.trim(),
        file_size_kb: Math.floor(900 + Math.random() * 2200),
        file_type: fileType,
        comments: studentComments.trim() || undefined,
      });

      setUploadSuccess(`Successfully submitted coursework for ${selectedAssessmentForUpload.module_code}!`);
      setSelectedAssessmentForUpload(null);
      setFileName('');
      setStudentComments('');
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayTuition = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) return;

    try {
      setIsPaying(true);
      await onRecordPayment({
        student_id: currentStudent.id,
        amount: num,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: payMethod,
        notes: 'Online student fee payment',
      });
      setIsPayModalOpen(false);
      setPayAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center font-bold text-2xl text-white shrink-0">
            {currentStudent.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-emerald-400">
                Student Profile
              </span>
              <span>·</span>
              <span className="text-xs text-slate-400">{currentStudent.academic_year}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">
              {currentStudent.full_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5 font-mono">
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold text-emerald-400">
                {currentStudent.student_id}
              </span>
              <span>{currentStudent.email}</span>
              <span>·</span>
              <span className="text-slate-400">{currentStudent.programme_name}</span>
            </div>
          </div>
        </div>

        {/* Balance Box */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col justify-between shrink-0 min-w-56">
          <div className="text-xs text-slate-400 flex justify-between items-center">
            <span>Outstanding Balance:</span>
            {currentStudent.is_overdue && (
              <span className="text-rose-400 font-semibold text-[10px] uppercase tracking-wider">
                Overdue
              </span>
            )}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums mt-1 text-white">
            {currentStudent.outstanding_balance === 0 ? (
              <span className="text-emerald-400">£0.00 (Paid in Full)</span>
            ) : (
              <span className={currentStudent.is_overdue ? 'text-rose-400' : 'text-amber-400'}>
                £{(currentStudent.outstanding_balance || 0).toLocaleString()}
              </span>
            )}
          </div>
          {(currentStudent.outstanding_balance || 0) > 0 && (
            <button
              type="button"
              onClick={() => {
                setPayAmount(String(currentStudent.outstanding_balance));
                setIsPayModalOpen(true);
              }}
              className="mt-3 w-full py-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-2xs"
            >
              Pay Balance
            </button>
          )}
        </div>
      </div>

      {/* Select Student Selector */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
        <span className="text-slate-500 font-medium">Viewing as:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {allStudents.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStudent(s.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors font-mono ${
                s.id === currentStudent.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.full_name} ({s.student_id})
            </button>
          ))}
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'assessments'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          My Assignments ({myAssessments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marksheet')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'marksheet'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Grades & Results
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'fees'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Fee Statement ({myPayments.length})
        </button>
      </div>

      {/* Tab 1: Assignments */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssessments.map((a) => {
              const deadlineDate = new Date(a.deadline);
              const isPastDeadline = now.getTime() > deadlineDate.getTime();
              const existingSub = mySubmissions.find((s) => s.assessment_id === a.id);

              return (
                <div
                  key={a.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-800">
                        {a.module_code} · {a.module_name}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        isPastDeadline
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isPastDeadline ? 'Deadline Passed' : 'Open'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {a.title}
                    </h3>

                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Deadline: {deadlineDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    {a.instructions && (
                      <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                        {a.instructions}
                      </p>
                    )}

                    {existingSub ? (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Submitted: {existingSub.file_name}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            Version {existingSub.version}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>{new Date(existingSub.submitted_at).toLocaleString()}</span>
                          {existingSub.is_late === 1 ? (
                            <span className="text-rose-600 font-semibold font-sans">Late Submission</span>
                          ) : (
                            <span className="text-emerald-700 font-sans">On Time</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>No submission uploaded yet.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Accepted formats: PDF, DOCX
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssessmentForUpload(a);
                        setFileName(`${currentStudent.full_name.replace(/\s+/g, '_')}_${a.module_code}_Work.pdf`);
                        setUploadError(null);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{existingSub ? 'Resubmit' : 'Upload'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Grades & Results */}
      {activeTab === 'marksheet' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Academic Results
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Only grades officially published by the registry are shown here.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Module & Title</th>
                  <th className="px-6 py-3 text-right">Grade</th>
                  <th className="px-6 py-3">Classification</th>
                  <th className="px-6 py-3">Feedback</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myGrades.map((g) => (
                  <tr key={g.id}>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{g.assessment_title}</div>
                      <div className="text-xs font-mono text-emerald-800 font-semibold">{g.module_code}</div>
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums font-bold">
                      {g.is_published === 1 ? (
                        <span className="text-slate-900 text-base">{g.numeric_grade.toFixed(1)}%</span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Withheld</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      {g.is_published === 1 ? (
                        <span className="font-semibold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {g.classification}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Under Review
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-sm">
                      {g.is_published === 1 ? (
                        g.feedback || <span className="text-slate-400 italic">No feedback provided</span>
                      ) : (
                        <span className="text-amber-800 italic">
                          Results are withheld pending final review.
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      {g.is_published === 1 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Lock className="w-3.5 h-3.5" />
                          Withheld
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {myGrades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                      No grades have been published for your account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fees & Receipts */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tuition Account Summary
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                Total Tuition: £{(currentStudent.total_fee || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Paid: <span className="font-semibold text-emerald-700 font-mono">£{(currentStudent.total_paid || 0).toLocaleString()}</span> · 
                Balance Due: <span className="font-semibold text-rose-700 font-mono">£{(currentStudent.outstanding_balance || 0).toLocaleString()}</span>
              </div>
            </div>

            {(currentStudent.outstanding_balance || 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPayAmount(String(currentStudent.outstanding_balance));
                  setIsPayModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                Pay Now
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
              Payment Receipts
            </div>
            <div className="divide-y divide-slate-100">
              {myPayments.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{p.reference_number}</div>
                    <div className="text-slate-500 mt-0.5">
                      {p.payment_date} · {p.payment_method} · {p.notes || 'Tuition Payment'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-700 text-sm">
                      £{p.amount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))}
              {myPayments.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No payments recorded on this account yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Coursework Modal */}
      {selectedAssessmentForUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Upload Coursework</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedAssessmentForUpload.module_code} · {selectedAssessmentForUpload.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessmentForUpload(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {uploadError}
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                <span className="text-slate-500">Deadline:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {new Date(selectedAssessmentForUpload.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  File Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. My_Assignment.pdf"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  File Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFileType('PDF')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      fileType === 'PDF'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    PDF (.pdf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileType('DOCX')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      fileType === 'DOCX'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    DOCX (.docx)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comments
                </label>
                <textarea
                  rows={2}
                  value={studentComments}
                  onChange={(e) => setStudentComments(e.target.value)}
                  placeholder="Optional note to tutor..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedAssessmentForUpload(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Tuition Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Pay Tuition</h3>
                <p className="text-xs text-slate-400 mt-0.5">Online payment</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayTuition} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Direct Debit">Direct Debit</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                >
                  {isPaying ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
