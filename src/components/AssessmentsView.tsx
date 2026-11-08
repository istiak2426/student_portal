import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Search,
  Filter,
  X,
  Eye
} from 'lucide-react';
import { Assessment, Submission, Student, Programme } from '../types';

interface AssessmentsViewProps {
  assessments: Assessment[];
  submissions: Submission[];
  students: Student[];
  programmes: Programme[];
  onCreateAssessment: (data: {
    title: string;
    module_code: string;
    module_name: string;
    programme_id: string;
    deadline: string;
    max_marks?: number;
    pass_marks?: number;
    instructions?: string;
  }) => Promise<void>;
  onSubmitWork: (data: {
    assessment_id: string;
    student_id: string;
    file_name: string;
    file_size_kb?: number;
    file_type?: string;
    comments?: string;
  }) => Promise<void>;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({
  assessments,
  submissions,
  students,
  programmes,
  onCreateAssessment,
  onSubmitWork,
}) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Assessment Form State
  const [title, setTitle] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || 'prog-cs');
  const [deadline, setDeadline] = useState('2025-11-30T23:59');
  const [instructions, setInstructions] = useState('');

  // Submit Work Modal State
  const [submitAssessmentId, setSubmitAssessmentId] = useState(assessments[0]?.id || '');
  const [submitStudentId, setSubmitStudentId] = useState(students[0]?.id || '');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [comments, setComments] = useState('');
  const [selectedSubmissionForPreview, setSelectedSubmissionForPreview] = useState<Submission | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !moduleCode.trim() || !moduleName.trim() || !deadline) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateAssessment({
        title: title.trim(),
        module_code: moduleCode.trim().toUpperCase(),
        module_name: moduleName.trim(),
        programme_id: programmeId,
        deadline,
        instructions: instructions.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setModuleCode('');
      setModuleName('');
      setInstructions('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fileName.trim()) {
      setFormError('Please provide a file name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitWork({
        assessment_id: submitAssessmentId,
        student_id: submitStudentId,
        file_name: fileName.trim(),
        file_size_kb: Math.floor(800 + Math.random() * 2500),
        file_type: fileType,
        comments: comments.trim() || undefined,
      });

      setIsSubmitModalOpen(false);
      setFileName('');
      setComments('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit coursework');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesAssessment = selectedAssessmentId === 'all' || sub.assessment_id === selectedAssessmentId;
    const matchesSearch =
      searchTerm === '' ||
      sub.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.assessment_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.module_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.file_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAssessment && matchesSearch;
  });

  const targetAssessment = assessments.find((a) => a.id === submitAssessmentId);
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Coursework & Submissions
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create module assessments, manage student coursework submissions, and monitor deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Assessment
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFileName(`Coursework_Submission_${Date.now().toString().slice(-4)}.pdf`);
              setIsSubmitModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            Upload Submission
          </button>
        </div>
      </div>

      {/* Assessment Modules Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {assessments.map((a) => {
          const deadlineDate = new Date(a.deadline);
          const isPassed = now.getTime() > deadlineDate.getTime();
          const isSelected = selectedAssessmentId === a.id;

          return (
            <div
              key={a.id}
              onClick={() => setSelectedAssessmentId(isSelected ? 'all' : a.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-emerald-800">
                  {a.module_code}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                  isPassed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isPassed ? 'Closed' : 'Open'}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-slate-900 mt-2 line-clamp-2">
                {a.title}
              </h3>

              <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                {a.module_name}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{new Date(a.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="font-semibold text-slate-800">
                  {a.submission_count || 0} Submitted
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Submissions Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter by assessment:</span>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="all">All Assessments ({submissions.length} submissions)</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.module_code} · {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or file..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-800">No submissions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select another assessment or upload a coursework file.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Assessment</th>
                  <th className="px-6 py-3">File</th>
                  <th className="px-6 py-3">Date Submitted</th>
                  <th className="px-6 py-3">Version</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{sub.student_name}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">{sub.student_code}</div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-800 text-xs">{sub.assessment_title}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{sub.module_code}</div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <div className="font-mono text-xs text-slate-800">{sub.file_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {sub.file_type} · {(sub.file_size_kb || 0).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-600 font-mono tabular-nums">
                      {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Version {sub.version || 1}
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      {sub.is_late === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Late Submission
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          On Time
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionForPreview(sub)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Assessment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Create Assessment</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set assessment details and submission deadline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Coursework"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Module Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleCode}
                    onChange={(e) => setModuleCode(e.target.value)}
                    placeholder="e.g. CS102"
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Module Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. Algorithms & Data Structures"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Programme
                  </label>
                  <select
                    value={programmeId}
                    onChange={(e) => setProgrammeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Instructions
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions for students (e.g. submit as PDF or DOCX)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Upload Coursework Submission</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload assignment file for student
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWorkSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={submitAssessmentId}
                  onChange={(e) => setSubmitAssessmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.module_code} · {a.title}
                    </option>
                  ))}
                </select>
                {targetAssessment && (
                  <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deadline: {new Date(targetAssessment.deadline).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={submitStudentId}
                  onChange={(e) => setSubmitStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    File Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Assignment_Report.pdf"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    File Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Comments
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submission Preview Modal */}
      {selectedSubmissionForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Submission Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">Coursework record</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionForPreview(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-900">{selectedSubmissionForPreview.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedSubmissionForPreview.student_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Module:</span>
                  <span className="font-mono text-emerald-800 font-semibold">{selectedSubmissionForPreview.module_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment:</span>
                  <span className="font-medium text-slate-800">{selectedSubmissionForPreview.assessment_title}</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">File:</span>
                  <span className="font-mono text-slate-800 font-medium">{selectedSubmissionForPreview.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Size:</span>
                  <span className="font-mono text-slate-700">{(selectedSubmissionForPreview.file_size_kb || 0).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Version:</span>
                  <span className="font-mono font-bold text-slate-900">Version {selectedSubmissionForPreview.version || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted:</span>
                  <span className="font-mono text-slate-700">{selectedSubmissionForPreview.submitted_at}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  {selectedSubmissionForPreview.is_late === 1 ? (
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Late Submission
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      On Time
                    </span>
                  )}
                </div>
              </div>

              {selectedSubmissionForPreview.comments && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Student Comments:</span>
                  <p className="text-slate-600 italic">{selectedSubmissionForPreview.comments}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmissionForPreview(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
