import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Download,
  Calendar,
  X,
  Printer
} from 'lucide-react';
import { Student, Payment, Programme } from '../types';

interface FeesViewProps {
  students: Student[];
  payments: Payment[];
  programmes: Programme[];
  onRecordPayment: (data: {
    student_id: string;
    amount: number;
    payment_date: string;
    reference_number?: string;
    payment_method?: string;
    notes?: string;
  }) => Promise<void>;
  preselectedStudentId?: string;
  onViewStudentProfile: (studentId: string) => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  students,
  payments,
  programmes,
  onRecordPayment,
  preselectedStudentId,
  onViewStudentProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'outstanding' | 'paid'>('all');
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions'>('balances');
  
  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(!!preselectedStudentId);
  const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || (students[0]?.id || ''));
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null);

  // Student balance filtering
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.programme_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'overdue') return s.is_overdue;
    if (statusFilter === 'outstanding') return (s.outstanding_balance || 0) > 0;
    if (statusFilter === 'paid') return (s.outstanding_balance || 0) === 0;

    return true;
  });

  // Filter transactions
  const filteredPayments = payments.filter((p) => {
    return (
      searchTerm === '' ||
      p.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId);

  const handleOpenRecordModal = (stuId?: string) => {
    if (stuId) setSelectedStudentId(stuId);
    setAmount('');
    setReferenceNumber(`PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormError(null);
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive payment amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordPayment({
        student_id: selectedStudentId,
        amount: numAmount,
        payment_date: paymentDate,
        reference_number: referenceNumber.trim() || undefined,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      setIsRecordModalOpen(false);
      setAmount('');
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial aggregates
  const totalBilled = students.reduce((acc, s) => acc + (s.total_fee || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (s.total_paid || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const overdueCount = students.filter((s) => s.is_overdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tuition Fees & Payments
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Track student tuition balances, record payments, and view payment receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenRecordModal()}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Invoiced
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            £{totalBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {students.length} students
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Collected
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            £{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block font-semibold">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% collected
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Outstanding Balance
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-800 mt-1">
            £{totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Remaining unpaid fees
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Overdue Accounts
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1">
            {overdueCount} Students
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block font-medium">
            Past payment deadline
          </span>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('balances')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'balances'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Balances ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment History ({payments.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student or reference..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {activeTab === 'balances' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('overdue')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-700 text-white font-medium'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                Overdue ({overdueCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('outstanding')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === 'outstanding'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Unpaid Balance
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-700 text-white font-medium'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Fully Paid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Balances or Transactions */}
      {activeTab === 'balances' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Student & Programme</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total Tuition</th>
                  <th className="px-6 py-3 text-right">Amount Paid</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Payment Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
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
                          {s.student_id} · {s.programme_name}
                        </div>
                      </button>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{s.enrolment_status}</span>
                      <div className="text-[11px] text-slate-400 font-mono">{s.academic_year}</div>
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-slate-700 text-xs">
                      £{(s.total_fee || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-emerald-700 text-xs font-semibold">
                      £{(s.total_paid || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums text-xs">
                      {s.outstanding_balance === 0 ? (
                        <span className="text-emerald-700 font-medium">£0.00</span>
                      ) : (
                        <span className={`font-bold ${s.is_overdue ? 'text-rose-700' : 'text-slate-900'}`}>
                          £{(s.outstanding_balance || 0).toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs font-mono tabular-nums text-slate-600">
                      {s.fee_due_date}
                    </td>

                    <td className="px-6 py-3.5">
                      {s.is_overdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Overdue
                        </span>
                      ) : s.outstanding_balance === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Settled
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenRecordModal(s.id)}
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
        </div>
      ) : (
        /* Transactions Ledger Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Payment Method</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">
                      {p.reference_number}
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{p.student_name}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">{p.student_code}</div>
                    </td>

                    <td className="px-6 py-3.5 text-xs font-mono tabular-nums text-slate-600">
                      {p.payment_date}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-700">
                      {p.payment_method}
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono tabular-nums font-bold text-emerald-700 text-xs">
                      £{p.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {p.receipt_status}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(p)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Record Payment</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record a tuition fee payment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {formError}
                </div>
              )}

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_id}) — Balance: £{(s.outstanding_balance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {selectedStudentObj && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                    <span className="text-slate-600">Current Outstanding Balance:</span>
                    <span className="font-mono tabular-nums font-bold text-rose-700">
                      £{(selectedStudentObj.outstanding_balance || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount (£) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Reference Number & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Direct Debit">Direct Debit</option>
                    <option value="Cash / Cheque">Cash / Cheque</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. First instalment"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-5" id="printable-receipt">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    PEN Global Registry
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Tuition Payment Receipt
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Ref: {viewingReceipt.reference_number}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Date: {viewingReceipt.payment_date}</div>
                  <div className="text-emerald-700 font-semibold mt-1">Confirmed</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-900">{viewingReceipt.student_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono text-slate-800 font-semibold">{viewingReceipt.student_code}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="text-slate-800">{viewingReceipt.payment_method}</span>
                </div>
                {viewingReceipt.notes && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Notes:</span>
                    <span className="text-slate-700 italic">{viewingReceipt.notes}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 text-sm">
                  <span className="font-bold text-slate-900">Total Paid:</span>
                  <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
                    £{viewingReceipt.amount.toLocaleString()} GBP
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded text-[11px] text-slate-500 text-center">
                Official payment receipt issued by the Registry Office.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
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
