import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Filter,
  Plus,
  Edit2,
  FileText,
  Printer,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Grade, Assessment, Student, GradeClassification } from '../types';

interface MarksheetViewProps {
  grades: Grade[];
  assessments: Assessment[];
  students: Student[];
  onRecordGrade: (data: {
    assessment_id: string;
    student_id: string;
    numeric_grade: number;
    is_published?: boolean;
    feedback?: string;
    graded_by?: string;
  }) => Promise<void>;
  onTogglePublish: (id: string, is_published?: boolean) => Promise<void>;
  onPublishAll: (assessment_id: string, publish: boolean) => Promise<void>;
}

export const MarksheetView: React.FC<MarksheetViewProps> = ({
  grades,
  assessments,
  students,
  onRecordGrade,
  onTogglePublish,
  onPublishAll,
}) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [publishStatusFilter, setPublishStatusFilter] = useState<'all' | 'published' | 'withheld'>('all');

  // Grade Entry Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [targetAssessmentId, setTargetAssessmentId] = useState(assessments[0]?.id || '');
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [numericGrade, setNumericGrade] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Marksheet Transcript Viewer Modal
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState<Student | null>(null);

  const calculateClass = (gradeNum: number): GradeClassification => {
    if (gradeNum >= 70) return 'Distinction';
    if (gradeNum >= 60) return 'Merit';
    if (gradeNum >= 40) return 'Pass';
    return 'Fail';
  };

  const currentPreviewClass = numericGrade !== '' && !isNaN(parseFloat(numericGrade))
    ? calculateClass(parseFloat(numericGrade))
    : null;

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const gradeVal = parseFloat(numericGrade);
    if (isNaN(gradeVal) || gradeVal < 0 || gradeVal > 100) {
      setFormError('Please enter a grade between 0 and 100.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordGrade({
        assessment_id: targetAssessmentId,
        student_id: targetStudentId,
        numeric_grade: gradeVal,
        is_published: isPublished,
        feedback: feedback.trim() || undefined,
        graded_by: 'Registry Examiner',
      });

      setIsGradeModalOpen(false);
      setNumericGrade('');
      setFeedback('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (g: Grade) => {
    setTargetAssessmentId(g.assessment_id);
    setTargetStudentId(g.student_id);
    setNumericGrade(String(g.numeric_grade));
    setIsPublished(g.is_published === 1);
    setFeedback(g.feedback || '');
    setFormError(null);
    setIsGradeModalOpen(true);
  };

  // Filter grades
  const filteredGrades = grades.filter((g) => {
    const matchesAssessment = selectedAssessmentId === 'all' || g.assessment_id === selectedAssessmentId;
    const matchesClassification = classificationFilter === 'all' || g.classification === classificationFilter;
    const matchesPublish =
      publishStatusFilter === 'all' ||
      (publishStatusFilter === 'published' && g.is_published === 1) ||
      (publishStatusFilter === 'withheld' && g.is_published === 0);

    const matchesSearch =
      searchTerm === '' ||
      g.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.assessment_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.module_code?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAssessment && matchesClassification && matchesPublish && matchesSearch;
  });

  const getClassificationBadge = (classification: GradeClassification) => {
    switch (classification) {
      case 'Distinction':
        return (
          <span className="font-semibold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Distinction (≥ 70)
          </span>
        );
      case 'Merit':
        return (
          <span className="font-semibold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Merit (60–69)
          </span>
        );
      case 'Pass':
        return (
          <span className="font-semibold text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Pass (40–59)
          </span>
        );
      case 'Fail':
        return (
          <span className="font-semibold text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            Fail (&lt; 40)
          </span>
        );
    }
  };

  const studentTranscriptGrades = selectedStudentForTranscript
    ? grades.filter((g) => g.student_id === selectedStudentForTranscript.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Grades & Results
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enter student grades, review classifications, and publish results to student accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setNumericGrade('');
              setFeedback('');
              setIsGradeModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Enter Grade
          </button>
        </div>
      </div>

      {/* Classification Scale */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Distinction</div>
            <div className="text-sm font-bold text-slate-900">70% and above</div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
            Pass
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider">Merit</div>
            <div className="text-sm font-bold text-slate-900">60% – 69%</div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
            Pass
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pass</div>
            <div className="text-sm font-bold text-slate-900">40% – 59%</div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
            Pass
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Fail</div>
            <div className="text-sm font-bold text-slate-900">Below 40%</div>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded">
            Resit
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Assessment Dropdown */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Assessment:</span>
            <select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="all">All Assessments ({grades.length} grades)</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.module_code} · {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Actions */}
          {selectedAssessmentId !== 'all' && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => onPublishAll(selectedAssessmentId, true)}
                className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Unlock className="w-3.5 h-3.5" />
                Publish All
              </button>
              <button
                type="button"
                onClick={() => onPublishAll(selectedAssessmentId, false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                Withhold All
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student or assessment..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Result:</span>
            <div className="flex items-center gap-1">
              {['all', 'Distinction', 'Merit', 'Pass', 'Fail'].map((cl) => (
                <button
                  key={cl}
                  type="button"
                  onClick={() => setClassificationFilter(cl)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    classificationFilter === cl
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cl === 'all' ? 'All' : cl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPublishStatusFilter('all')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  publishStatusFilter === 'all'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPublishStatusFilter('published')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  publishStatusFilter === 'published'
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Unlock className="w-3 h-3" />
                Published
              </button>
              <button
                type="button"
                onClick={() => setPublishStatusFilter('withheld')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  publishStatusFilter === 'withheld'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Lock className="w-3 h-3" />
                Withheld ({grades.filter((g) => g.is_published === 0).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredGrades.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-800">No grades found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;Enter Grade&quot; to grade student coursework.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Assessment</th>
                  <th className="px-6 py-3 text-right">Grade (0–100)</th>
                  <th className="px-6 py-3">Classification</th>
                  <th className="px-6 py-3">Feedback</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGrades.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{g.student_name}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">{g.student_code}</div>
                    </td>

                    <td className="px-6 py-3.5 text-xs">
                      <div className="font-medium text-slate-800">{g.assessment_title}</div>
                      <div className="font-mono text-emerald-800 font-semibold text-[11px]">{g.module_code}</div>
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums font-bold text-base text-slate-900">
                      {g.numeric_grade.toFixed(1)}%
                    </td>

                    <td className="px-6 py-3.5">
                      {getClassificationBadge(g.classification)}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate" title={g.feedback}>
                      {g.feedback || <span className="text-slate-400 italic">No feedback added</span>}
                    </td>

                    <td className="px-6 py-3.5">
                      {g.is_published === 1 ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Published</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 w-fit">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Withheld</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Publish / Withhold Toggle */}
                      <button
                        type="button"
                        onClick={() => onTogglePublish(g.id, g.is_published === 1 ? false : true)}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors inline-flex items-center gap-1 ${
                          g.is_published === 1
                            ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={g.is_published === 1 ? 'Hide from student view' : 'Show in student view'}
                      >
                        {g.is_published === 1 ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Withhold</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(g)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      {/* Transcript */}
                      <button
                        type="button"
                        onClick={() => {
                          const stu = students.find((s) => s.id === g.student_id);
                          if (stu) setSelectedStudentForTranscript(stu);
                        }}
                        className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="View Transcript"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Entry Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Enter Student Grade</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record grade and classification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              {/* Assessment Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assessment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetAssessmentId}
                  onChange={(e) => setTargetAssessmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.module_code} · {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Numeric Grade Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Grade (0–100) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    required
                    value={numericGrade}
                    onChange={(e) => setNumericGrade(e.target.value)}
                    placeholder="e.g. 74.5"
                    className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Classification
                  </span>
                  <div className="mt-1">
                    {currentPreviewClass ? (
                      getClassificationBadge(currentPreviewClass)
                    ) : (
                      <span className="text-xs text-slate-400 italic">Enter grade</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Publication Status Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Show in Student Portal
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isPublished
                      ? 'Student will see this grade on their marksheet'
                      : 'Grade is withheld until published'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                    isPublished
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isPublished ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isPublished ? 'Published' : 'Withheld'}</span>
                </button>
              </div>

              {/* Feedback Comments */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Examiner Feedback
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional comments for student..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedStudentForTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto space-y-6" id="printable-transcript">
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    PEN Global Registry
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Academic Marksheet & Transcript
                  </h2>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Academic Year {selectedStudentForTranscript.academic_year}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <div>Date Issued: {new Date().toLocaleDateString([], { dateStyle: 'long' })}</div>
                  <div className="font-mono text-emerald-800 font-semibold mt-1">Status: {selectedStudentForTranscript.enrolment_status}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Name:</span>
                  <span className="font-semibold text-slate-900">{selectedStudentForTranscript.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Student ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudentForTranscript.student_id}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block">Programme:</span>
                  <span className="font-semibold text-slate-900">{selectedStudentForTranscript.programme_name}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Completed Assessments
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Module</th>
                        <th className="px-4 py-2.5">Assessment</th>
                        <th className="px-4 py-2.5 text-right">Grade</th>
                        <th className="px-4 py-2.5">Classification</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentTranscriptGrades.map((tg) => (
                        <tr key={tg.id}>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                            {tg.module_code}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {tg.assessment_title}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                            {tg.numeric_grade.toFixed(1)}%
                          </td>
                          <td className="px-4 py-2.5">
                            {getClassificationBadge(tg.classification)}
                          </td>
                          <td className="px-4 py-2.5">
                            {tg.is_published === 1 ? (
                              <span className="text-emerald-700 font-medium">Published</span>
                            ) : (
                              <span className="text-amber-700 font-medium">Withheld</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Grading Scale:</span>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Distinction (≥ 70%) · Merit (60–69%) · Pass (40–59%) · Fail (&lt; 40%)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Average Grade:</span>
                  <span className="text-base font-bold font-mono text-emerald-800">
                    {studentTranscriptGrades.length > 0
                      ? (
                          studentTranscriptGrades.reduce((acc, g) => acc + g.numeric_grade, 0) /
                          studentTranscriptGrades.length
                        ).toFixed(1)
                      : 'N/A'}%
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Transcript
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentForTranscript(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
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
