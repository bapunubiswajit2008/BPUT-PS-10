import { Award, Download, ExternalLink, FileText, Filter, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BRANCH_OPTIONS } from '../data/seedData';
import type { RecruiterFilterState, StudentProfile, VisitingCompany } from '../types/placement';
import { filterRecruiterCandidates, rankStudents } from '../utils/placementLogic';

interface RecruiterPortalProps {
  recruiterOrg: string;
  students: StudentProfile[];
  companies: VisitingCompany[];
}

export function RecruiterPortal({
  recruiterOrg,
  students,
  companies,
}: RecruiterPortalProps) {
  const [filters, setFilters] = useState<RecruiterFilterState>({
    companyId: 'all',
    minCgpa: 0,
    branch: 'all',
    skillQuery: '',
    maxBacklogs: 5,
    minWeightedScore: 0,
    recommendedOnly: false,
  });

  const ranked = useMemo(() => rankStudents(students), [students]);
  const filteredCandidates = useMemo(
    () => filterRecruiterCandidates(ranked, filters, companies),
    [ranked, filters, companies]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    filteredCandidates[0]?.student.id ?? students[0]?.id ?? ''
  );

  const activeEntry =
    filteredCandidates.find((c) => c.student.id === selectedStudentId) ??
    filteredCandidates[0] ??
    null;

  function handleCompanyPresetChange(companyId: string) {
    if (companyId === 'all') {
      setFilters((prev) => ({
        ...prev,
        companyId: 'all',
        minCgpa: 0,
        maxBacklogs: 5,
      }));
      return;
    }
    const comp = companies.find((c) => c.id === companyId);
    if (!comp) return;
    setFilters((prev) => ({
      ...prev,
      companyId,
      minCgpa: comp.minCgpa,
      maxBacklogs: comp.maxBacklogs,
    }));
  }

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-[#1D4ED8]">{recruiterOrg}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Suggested Candidates &amp; Resume Screening
            </h1>
            <p className="mt-1 text-[15px] text-slate-600">
              Filter students by company eligibility requirements, inspect verified assessment &amp; trust scores, and preview PDF resumes.
            </p>
          </div>
          <div className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg tabular-nums shrink-0">
            Showing {filteredCandidates.length} of {students.length} students
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="rec-company-select" className="block text-sm font-medium text-slate-700">
              Company Criteria Preset
            </label>
            <select
              id="rec-company-select"
              value={filters.companyId}
              onChange={(e) => handleCompanyPresetChange(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="all">All Companies (Custom Filter)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (CGPA ≥ {c.minCgpa.toFixed(1)}, Test ≥ {c.minAssessmentPct}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rec-branch-select" className="block text-sm font-medium text-slate-700">
              Branch
            </label>
            <select
              id="rec-branch-select"
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="mt-1.5 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="all">All Branches</option>
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rec-min-cgpa" className="block text-sm font-medium text-slate-700">
              Min CGPA
            </label>
            <input
              id="rec-min-cgpa"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={filters.minCgpa}
              onChange={(e) =>
                setFilters({ ...filters, minCgpa: parseFloat(e.target.value) || 0 })
              }
              className="mt-1.5 w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="rec-skill-query" className="block text-sm font-medium text-slate-700">
              Skill / Name
            </label>
            <input
              id="rec-skill-query"
              type="text"
              value={filters.skillQuery}
              onChange={(e) => setFilters({ ...filters, skillQuery: e.target.value })}
              placeholder="e.g. React, SQL"
              className="mt-1.5 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center h-10">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.recommendedOnly}
                onChange={(e) =>
                  setFilters({ ...filters, recommendedOnly: e.target.checked })
                }
                className="w-4 h-4 accent-[#1D4ED8]"
              />
              <span>Recommended Only</span>
            </label>
          </div>
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <Filter className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
          <p className="text-base font-semibold text-slate-900">
            No candidates match the selected company criteria.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({
                companyId: 'all',
                minCgpa: 0,
                branch: 'all',
                skillQuery: '',
                maxBacklogs: 5,
                minWeightedScore: 0,
                recommendedOnly: false,
              })
            }
            className="px-4 py-2 text-sm font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            {filteredCandidates.map((entry) => {
              const s = entry.student;
              const isSelected = activeEntry?.student.id === s.id;
              const isRecommended = s.recommendedToCompanies.length > 0;
              const recCompanyNames = companies
                .filter((c) => s.recommendedToCompanies.includes(c.id))
                .map((c) => c.name);

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/60 border-[#1D4ED8]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          Rank #{entry.rank}
                        </span>
                        {isRecommended && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D4ED8]">
                            <Award className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Placement Cell Recommended</span>
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">{s.name}</h2>
                      <p className="text-sm text-slate-600">
                        {s.branch} · CGPA {s.cgpa.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                        {entry.hasCompletedAssessment ? entry.weightedScore.toFixed(1) : '—'}
                      </div>
                      <div className="text-xs text-slate-500">Rank Score</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    Skills: <span className="text-slate-800">{s.skills.join(' · ')}</span>
                  </div>
                  {recCompanyNames.length > 0 && (
                    <div className="mt-1.5 text-xs font-medium text-emerald-700">
                      Endorsed for: {recCompanyNames.join(', ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {activeEntry && (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="font-mono">{activeEntry.student.rollNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeEntry.student.email}</span>
                    <span aria-hidden="true">·</span>
                    <span>Class of {activeEntry.student.graduationYear}</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {activeEntry.student.name}
                  </h2>
                  <p className="text-base text-slate-700">{activeEntry.student.branch}</p>
                </div>

                {activeEntry.student.portfolioUrl && (
                  <a
                    href={activeEntry.student.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 shrink-0"
                  >
                    <span>GitHub / Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">CGPA</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {activeEntry.student.cgpa.toFixed(2)} / 10
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Assessment %</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {activeEntry.hasCompletedAssessment
                      ? `${activeEntry.assessmentPct.toFixed(1)}%`
                      : 'Pending'}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Trust Score</div>
                  <div className="mt-1 font-mono text-lg font-bold text-emerald-700 tabular-nums">
                    {activeEntry.hasCompletedAssessment ? `${activeEntry.trustScore} / 100` : '—'}
                  </div>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500">Backlogs</div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-900 tabular-nums">
                    {activeEntry.student.activeBacklogs}
                  </div>
                </div>
              </div>

              {activeEntry.student.recommendedToCompanies.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Placement Cell Endorsement</span>
                  </div>
                  <p className="text-sm text-slate-800">
                    {activeEntry.student.placementNote ||
                      'Directly recommended by the Campus Placement Cell.'}
                  </p>
                </div>
              )}

              {activeEntry.student.latestResult && (
                <div className="space-y-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Verified Subject Proficiency
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeEntry.student.latestResult.subjectBreakdown.map((sub) => (
                      <div
                        key={sub.subject}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                      >
                        <span className="text-slate-700">{sub.subject}</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {sub.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#1D4ED8]" aria-hidden="true" />
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Candidate Resume PDF</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {activeEntry.student.resumeFileName}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/students/${activeEntry.student.id}/resume.pdf?download=1`}
                    download={activeEntry.student.resumeFileName || 'candidate_resume.pdf'}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Download Resume PDF</span>
                  </a>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 h-[360px]">
                  <object
                    data={`/api/students/${activeEntry.student.id}/resume.pdf`}
                    type="application/pdf"
                    aria-label={`Resume PDF for ${activeEntry.student.name}`}
                    className="w-full h-full"
                  >
                    <div className="h-full flex flex-col justify-between p-6 bg-white text-slate-800">
                      <div className="space-y-2">
                        <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
                          Stored Resume Summary
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">
                          {activeEntry.student.name} — {activeEntry.student.rollNumber}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {activeEntry.student.branch} · CGPA {activeEntry.student.cgpa.toFixed(2)} · Class of {activeEntry.student.graduationYear}
                        </p>
                        <p className="text-sm text-slate-700 pt-2">
                          <span className="font-semibold">Technical Skills:</span>{' '}
                          {activeEntry.student.skills.join(', ')}
                        </p>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">Uploaded File:</span>{' '}
                          <span className="font-mono">{activeEntry.student.resumeFileName}</span>
                        </p>
                      </div>
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
                        <span>Inline PDF plugin unavailable in this browser view.</span>
                        <a
                          href={`/api/students/${activeEntry.student.id}/resume.pdf?download=1`}
                          download={activeEntry.student.resumeFileName || 'candidate_resume.pdf'}
                          className="font-semibold text-[#1D4ED8] hover:underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </object>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
