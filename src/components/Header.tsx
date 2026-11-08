import React from 'react';
import {
  GraduationCap,
  Users,
  CreditCard,
  FileCheck,
  Award,
  UserCheck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Role, Student } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  role: Role;
  setRole: (role: Role) => void;
  students: Student[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  onResetDatabase: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  role,
  setRole,
  students,
  selectedStudentId,
  setSelectedStudentId,
  onResetDatabase,
  isResetting,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Bar Navigation */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              PEN Global Registry
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto py-2">
          {role === 'staff' ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'dashboard'
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('enrolment')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'enrolment'
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Students
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('fees')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'fees'
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Fees & Payments
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('assessments')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'assessments'
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Assessments
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab('marksheet')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentTab === 'marksheet'
                    ? 'text-emerald-800 bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Award className="w-4 h-4" />
                Grades & Results
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Student Portal</span>
              <span>·</span>
              <span className="text-slate-500">Student Self-Service View</span>
            </div>
          )}
        </nav>

        {/* Zone 3: Role Switcher & Student Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                role === 'staff'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Staff View
            </button>
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                role === 'student'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-700" />
              Student View
            </button>
          </div>

          {role === 'student' && students.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600 shadow-2xs font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onResetDatabase}
            disabled={isResetting}
            title="Reset to sample data"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
