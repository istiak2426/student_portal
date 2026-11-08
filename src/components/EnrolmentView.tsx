import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Ban,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { Student, Programme, EnrolmentStatus } from '../types';

interface EnrolmentViewProps {
  students: Student[];
  programmes: Programme[];
  onAddStudent: (data: {
    full_name: string;
    email: string;
    dob: string;
    programme_id: string;
    academic_year: string;
    enrolment_status: EnrolmentStatus;
    fee_due_date?: string;
  }) => Promise<void>;
  onUpdateStatus: (studentId: string, status: EnrolmentStatus) => Promise<void>;
  onViewStudentProfile: (studentId: string) => void;
  isLoading: boolean;
}

export const EnrolmentView: React.FC<EnrolmentViewProps> = ({
  students,
  programmes,
  onAddStudent,
  onUpdateStatus,
  onViewStudentProfile,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Student Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('2004-06-15');
  const [programmeId, setProgrammeId] = useState(programmes[0]?.id || 'prog-cs');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [enrolmentStatus, setEnrolmentStatus] = useState<EnrolmentStatus>('Enrolled');
  const [feeDueDate, setFeeDueDate] = useState('2025-10-15');

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProg = selectedProgramme === 'all' || s.programme_id === selectedProgramme;
    const matchesStatus = selectedStatus === 'all' || s.enrolment_status === selectedStatus;
    const matchesYear = selectedYear === 'all' || s.academic_year === selectedYear;

    return matchesSearch && matchesProg && matchesStatus && matchesYear;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !dob) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddStudent({
        full_name: fullName.trim(),
        email: email.trim(),
        dob,
        programme_id: programmeId,
        academic_year: academicYear,
        enrolment_status: enrolmentStatus,
        fee_due_date: feeDueDate,
      });

      setFullName('');
      setEmail('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: EnrolmentStatus) => {
    switch (status) {
      case 'Enrolled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Enrolled
          </span>
        );
      case 'Deferred':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Deferred
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            Completed
          </span>
        );
      case 'Withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            <Ban className="w-3 h-3 text-slate-500" />
            Withdrawn
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const activeProgrammeObj = programmes.find((p) => p.id === programmeId);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Records
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View and manage student enrolment details, programmes, and academic status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, ID, or email..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Programme Filter */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="w-full md:w-48 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-700"
            >
              <option value="all">All Programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full md:w-36 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Deferred">Deferred</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="w-full md:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full md:w-32 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 text-slate-700"
            >
              <option value="all">All Years</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredStudents.length}</span> of{' '}
            <span className="font-mono tabular-nums">{students.length}</span> students
          </div>
          {(searchTerm || selectedProgramme !== 'all' || selectedStatus !== 'all' || selectedYear !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedProgramme('all');
                setSelectedStatus('all');
                setSelectedYear('all');
              }}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search or add a new student.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student Name & ID</th>
                  <th className="px-6 py-3">Programme</th>
                  <th className="px-6 py-3">Academic Year</th>
                  <th className="px-6 py-3">Date of Birth</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Fee Balance</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student ID & Name */}
                    <td className="px-6 py-3.5">
                      <button
                        type="button"
                        onClick={() => onViewStudentProfile(s.id)}
                        className="text-left group"
                      >
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {s.full_name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          <span className="font-semibold text-slate-700">{s.student_id}</span> · {s.email}
                        </div>
                      </button>
                    </td>

                    {/* Programme */}
                    <td className="px-6 py-3.5 text-xs text-slate-700">
                      <div className="font-medium text-slate-900">{s.programme_name}</div>
                      <div className="text-slate-400 font-mono">{s.programme_code}</div>
                    </td>

                    {/* Academic Year */}
                    <td className="px-6 py-3.5 text-xs font-mono tabular-nums text-slate-600">
                      {s.academic_year}
                    </td>

                    {/* DOB */}
                    <td className="px-6 py-3.5 text-xs text-slate-600 font-mono tabular-nums">
                      {s.dob}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(s.enrolment_status)}
                        <select
                          value={s.enrolment_status}
                          onChange={(e) => onUpdateStatus(s.id, e.target.value as EnrolmentStatus)}
                          className="text-[11px] bg-transparent text-slate-400 hover:text-slate-700 border-0 cursor-pointer focus:ring-0 p-0"
                          title="Change status"
                        >
                          <option value="Enrolled">Enrolled</option>
                          <option value="Deferred">Deferred</option>
                          <option value="Withdrawn">Withdrawn</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-xs">
                      {s.outstanding_balance === 0 ? (
                        <span className="text-emerald-700 font-medium">Paid in Full</span>
                      ) : (
                        <div>
                          <span className={s.is_overdue ? 'font-bold text-rose-700' : 'text-slate-800'}>
                            £{(s.outstanding_balance || 0).toLocaleString()}
                          </span>
                          {s.is_overdue && (
                            <div className="text-[10px] text-rose-600 font-sans font-semibold">Overdue</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Profile Link */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewStudentProfile(s.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Add New Student</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create a new student record
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tariq Rahman"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                {/* Email Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. tariq.rahman@student.pen.edu"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>

                {/* Programme */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Degree Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={programmeId}
                    onChange={(e) => setProgrammeId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name} (£{p.annual_fee.toLocaleString()}/yr)
                      </option>
                    ))}
                  </select>
                  {activeProgrammeObj && (
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{activeProgrammeObj.department}</span>
                      <span className="font-semibold text-slate-800">
                        Annual Tuition: £{activeProgrammeObj.annual_fee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Enrolment Status */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={enrolmentStatus}
                    onChange={(e) => setEnrolmentStatus(e.target.value as EnrolmentStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  >
                    <option value="Enrolled">Enrolled</option>
                    <option value="Deferred">Deferred</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Fee Due Date */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fee Due Date
                  </label>
                  <input
                    type="date"
                    value={feeDueDate}
                    onChange={(e) => setFeeDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
