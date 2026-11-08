/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { EnrolmentView } from './components/EnrolmentView';
import { FeesView } from './components/FeesView';
import { AssessmentsView } from './components/AssessmentsView';
import { MarksheetView } from './components/MarksheetView';
import { StudentPortalView } from './components/StudentPortalView';
import { StudentProfileModal } from './components/StudentProfileModal';
import {
  fetchStats,
  fetchProgrammes,
  fetchStudents,
  fetchPayments,
  fetchAssessments,
  fetchSubmissions,
  fetchGrades,
  createStudent,
  updateStudent,
  recordPayment,
  createAssessment,
  submitAssessmentWork,
  recordGrade,
  togglePublishGrade,
  publishAllAssessmentGrades,
  resetDatabase,
} from './api';
import {
  Role,
  Student,
  Programme,
  Payment,
  Assessment,
  Submission,
  Grade,
  RegistryStats,
  EnrolmentStatus,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [role, setRole] = useState<Role>('staff');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Core Data State
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [viewingProfileStudentId, setViewingProfileStudentId] = useState<string | null>(null);
  const [quickPaymentStudentId, setQuickPaymentStudentId] = useState<string | undefined>(undefined);

  // Load all data from backend
  const loadAllData = useCallback(async () => {
    try {
      const [
        statsData,
        progData,
        stuData,
        payData,
        asmData,
        subData,
        grdData,
      ] = await Promise.all([
        fetchStats(),
        fetchProgrammes(),
        fetchStudents(),
        fetchPayments(),
        fetchAssessments(),
        fetchSubmissions(),
        fetchGrades(),
      ]);

      setStats(statsData);
      setProgrammes(progData);
      setStudents(stuData);
      setPayments(payData);
      setAssessments(asmData);
      setSubmissions(subData);
      setGrades(grdData);

      if (stuData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuData[0].id);
      }
    } catch (err) {
      console.error('Failed to load registry data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Add Student
  const handleAddStudent = async (data: {
    full_name: string;
    email: string;
    dob: string;
    programme_id: string;
    academic_year: string;
    enrolment_status: EnrolmentStatus;
    fee_due_date?: string;
  }) => {
    await createStudent(data);
    await loadAllData();
  };

  // Handle Update Student Status
  const handleUpdateStatus = async (studentId: string, status: EnrolmentStatus) => {
    await updateStudent(studentId, { enrolment_status: status });
    await loadAllData();
  };

  // Handle Record Payment
  const handleRecordPayment = async (data: {
    student_id: string;
    amount: number;
    payment_date: string;
    reference_number?: string;
    payment_method?: string;
    notes?: string;
  }) => {
    await recordPayment(data);
    await loadAllData();
  };

  // Handle Create Assessment
  const handleCreateAssessment = async (data: {
    title: string;
    module_code: string;
    module_name: string;
    programme_id: string;
    deadline: string;
    max_marks?: number;
    pass_marks?: number;
    instructions?: string;
  }) => {
    await createAssessment(data);
    await loadAllData();
  };

  // Handle Submit Work
  const handleSubmitWork = async (data: {
    assessment_id: string;
    student_id: string;
    file_name: string;
    file_size_kb?: number;
    file_type?: string;
    comments?: string;
  }) => {
    await submitAssessmentWork(data);
    await loadAllData();
  };

  // Handle Record Grade
  const handleRecordGrade = async (data: {
    assessment_id: string;
    student_id: string;
    numeric_grade: number;
    is_published?: boolean;
    feedback?: string;
    graded_by?: string;
  }) => {
    await recordGrade(data);
    await loadAllData();
  };

  // Handle Toggle Publish
  const handleTogglePublish = async (id: string, is_published?: boolean) => {
    await togglePublishGrade(id, is_published);
    await loadAllData();
  };

  // Handle Batch Publish All
  const handlePublishAll = async (assessment_id: string, publish: boolean) => {
    await publishAllAssessmentGrades(assessment_id, publish);
    await loadAllData();
  };

  // Handle Reset Database
  const handleResetDatabase = async () => {
    if (!window.confirm('Reset sample records to default demo data?')) {
      return;
    }
    try {
      setIsResetting(true);
      await resetDatabase();
      await loadAllData();
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const currentStudentPersona = students.find((s) => s.id === selectedStudentId) || students[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        role={role}
        setRole={setRole}
        students={students}
        selectedStudentId={selectedStudentId}
        setSelectedStudentId={setSelectedStudentId}
        onResetDatabase={handleResetDatabase}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Loading student records...</p>
          </div>
        ) : role === 'student' ? (
          /* Student Portal View */
          <StudentPortalView
            currentStudent={currentStudentPersona}
            allStudents={students}
            onSelectStudent={setSelectedStudentId}
            payments={payments}
            assessments={assessments}
            submissions={submissions}
            grades={grades}
            onSubmitWork={handleSubmitWork}
            onRecordPayment={handleRecordPayment}
          />
        ) : (
          /* Staff (Registry Administrator) Views */
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                students={students}
                submissions={submissions}
                assessments={assessments}
                onNavigateTab={setCurrentTab}
                onOpenRecordPayment={(stuId) => {
                  setQuickPaymentStudentId(stuId);
                  setCurrentTab('fees');
                }}
                onViewStudentProfile={(stuId) => setViewingProfileStudentId(stuId)}
              />
            )}

            {currentTab === 'enrolment' && (
              <EnrolmentView
                students={students}
                programmes={programmes}
                onAddStudent={handleAddStudent}
                onUpdateStatus={handleUpdateStatus}
                onViewStudentProfile={(stuId) => setViewingProfileStudentId(stuId)}
                isLoading={isLoading}
              />
            )}

            {currentTab === 'fees' && (
              <FeesView
                students={students}
                payments={payments}
                programmes={programmes}
                onRecordPayment={handleRecordPayment}
                preselectedStudentId={quickPaymentStudentId}
                onViewStudentProfile={(stuId) => setViewingProfileStudentId(stuId)}
              />
            )}

            {currentTab === 'assessments' && (
              <AssessmentsView
                assessments={assessments}
                submissions={submissions}
                students={students}
                programmes={programmes}
                onCreateAssessment={handleCreateAssessment}
                onSubmitWork={handleSubmitWork}
              />
            )}

            {currentTab === 'marksheet' && (
              <MarksheetView
                grades={grades}
                assessments={assessments}
                students={students}
                onRecordGrade={handleRecordGrade}
                onTogglePublish={handleTogglePublish}
                onPublishAll={handlePublishAll}
              />
            )}
          </>
        )}
      </main>

      {/* Student Profile Modal */}
      {viewingProfileStudentId && (
        <StudentProfileModal
          studentId={viewingProfileStudentId}
          onClose={() => setViewingProfileStudentId(null)}
          onOpenRecordPayment={(stuId) => {
            setQuickPaymentStudentId(stuId);
            setCurrentTab('fees');
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-800">PEN Global Student Management System</span>
            <span className="mx-2">·</span>
            <span>Registry Office</span>
          </div>
          <div className="text-slate-500">
            <span>Academic Year 2025/2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
