import { Award, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { BRANCH_OPTIONS } from '../data/seedData';
import type { StudentProfile, VisitingCompany } from '../types/placement';
import { rankStudents } from '../utils/placementLogic';

interface PlacementCellPortalProps {
  students: StudentProfile[];
  companies: VisitingCompany[];
  onSaveRecommendation: (
    studentId: string,
    companyIds: string[],
    placementNote: string
  ) => Promise<void>;
}

export function PlacementCellPortal({
  students,
  companies,
  onSaveRecommendation,
}: PlacementCellPortalProps) {
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'recommended'>('all');
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const ranked = rankStudents(students);
  const filtered = ranked.filter((entry) => {
    if (branchFilter !== 'all' && entry.student.branch !== branchFilter) return false;
    if (statusFilter === 'verified' && !entry.trustCleared) return false;
    if (statusFilter === 'recommended' && entry.student.recommendedToCompanies.length === 0) {
      return false;
    }
    return true;
  });

  const completedCount = ranked.filter((r) => r.hasCompletedAssessment).length;
  const verifiedCount = ranked.filter((r) => r.trustCleared).length;
  const recommendedCount = ranked.filter((r) => r.student.recommendedToCompanies.length > 0).length;

  function openRecommendModal(student: StudentProfile) {
    setEditingStudent(student);
    setSelectedCompanies(student.recommendedToCompanies);
    setNoteInput(
      student.placementNote ||
        'Recommended by Campus Placement Cell based on verified composite rank score.'
    );
  }

  function toggleCompanySelection(companyId: string) {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  }

  async function handleConfirmRecommend() {
    if (!editingStudent) return;
    setIsSaving(true);
    await onSaveRecommendation(editingStudent.id, selectedCompanies, noteInput);
    setIsSaving(false);
    setEditingStudent(null);
  }

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-[#1D4ED8]">Campus Placement Cell Administration</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Cohort Merit Rank &amp; Recruiter Endorsements
            </h1>
            <p className="mt-2 text-[15px] text-slate-600">
              Students are ranked deterministically using{' '}
              <span className="font-mono font-semibold text-slate-900">
                (0.75 × Assessment Test %) + (0.25 × Trust Score)
              </span>
              .
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Registered Students</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {students.length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Tests Completed</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {completedCount}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Trust-Verified</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {verifiedCount}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Recommended to Recruiters</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[#1D4ED8] tabular-nums">
              {recommendedCount}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Ranks
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer ${
                statusFilter === 'verified' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Trust Cleared
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('recommended')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer ${
                statusFilter === 'recommended' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Recommended ({recommendedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="plc-branch-filter" className="text-sm font-medium text-slate-700">
              Branch:
            </label>
            <select
              id="plc-branch-filter"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="all">All Branches</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 pr-4">Rank</th>
                <th className="py-3 pr-4">Student</th>
                <th className="py-3 pr-4">Branch &amp; CGPA</th>
                <th className="py-3 pr-4 text-right">Test %</th>
                <th className="py-3 pr-4 text-right">Trust Score</th>
                <th className="py-3 pr-4 text-right">Weighted Rank Score</th>
                <th className="py-3 pr-4">Status &amp; Endorsements</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.map((entry) => {
                const s = entry.student;
                const recNames = companies
                  .filter((c) => s.recommendedToCompanies.includes(c.id))
                  .map((c) => c.name);

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-4 pr-4 font-mono font-bold text-slate-900 tabular-nums">
                      #{entry.rank}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-slate-900 text-[15px]">{s.name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {s.rollNumber} · {s.email}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-slate-800">{s.branch}</div>
                      <div className="text-xs font-mono text-slate-500 tabular-nums">
                        CGPA {s.cgpa.toFixed(2)} · {s.activeBacklogs} backlogs
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {entry.hasCompletedAssessment ? `${entry.assessmentPct.toFixed(1)}%` : 'Pending'}
                    </td>
                    <td className="py-4 pr-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                      {entry.hasCompletedAssessment ? `${entry.trustScore}/100` : '—'}
                    </td>
                    <td className="py-4 pr-4 text-right font-mono text-base font-bold text-[#1D4ED8] tabular-nums">
                      {entry.hasCompletedAssessment ? entry.weightedScore.toFixed(2) : '—'}
                    </td>
                    <td className="py-4 pr-4">
                      {!entry.hasCompletedAssessment ? (
                        <span className="text-xs font-medium text-slate-500">Test Not Taken</span>
                      ) : entry.trustCleared ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Verified</span>
                          </span>
                          {recNames.length > 0 && (
                            <div className="text-xs font-medium text-[#1D4ED8]">
                              Sent to: {recNames.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                          <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Flagged (Low Trust)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openRecommendModal(s)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{recNames.length > 0 ? 'Update Endorsement' : 'Recommend'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recommend-dialog-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#1D4ED8] flex items-center gap-1.5">
                  <Award className="w-4 h-4" aria-hidden="true" />
                  <span>Direct Recruiter Recommendation</span>
                </p>
                <h2 id="recommend-dialog-title" className="mt-1 text-xl font-bold text-slate-900">
                  Recommend {editingStudent.name}
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-800">
                Select Target Visiting Companies
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {companies.map((c) => {
                  const checked = selectedCompanies.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm cursor-pointer ${
                        checked
                          ? 'bg-blue-50 border-[#1D4ED8] text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompanySelection(c.id)}
                        className="w-4 h-4 accent-[#1D4ED8]"
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="plc-note-input" className="block text-sm font-medium text-slate-800">
                Placement Cell Note for Recruiter
              </label>
              <textarea
                id="plc-note-input"
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmRecommend}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
