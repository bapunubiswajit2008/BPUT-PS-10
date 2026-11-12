import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { StudentProfile, VisitingCompany } from '../types/placement';
import { evaluateCompanyEligibility } from '../utils/placementLogic';

interface StudentCompaniesTabProps {
  student: StudentProfile;
  companies: VisitingCompany[];
}

export function StudentCompaniesTab({ student, companies }: StudentCompaniesTabProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'eligible'>('all');
  const [query, setQuery] = useState('');

  const evaluations = companies.map((c) => evaluateCompanyEligibility(student, c));
  const filtered = evaluations.filter((item) => {
    if (filterMode === 'eligible' && !item.profileCleared) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.company.name.toLowerCase().includes(q) ||
      item.company.roleTitle.toLowerCase().includes(q) ||
      item.company.requiredSkills.some((sk) => sk.toLowerCase().includes(q))
    );
  });

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Visiting Companies &amp; Eligibility Criteria
          </h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Your profile ({student.branch} · CGPA {student.cgpa.toFixed(2)} · {student.activeBacklogs} backlogs) is checked against every recruiter’s requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company or skill..."
              aria-label="Search visiting companies"
              className="pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Companies ({companies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('eligible')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterMode === 'eligible'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile Match ({evaluations.filter((e) => e.profileCleared).length})
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-base font-medium text-slate-800">
            No visiting companies matched your filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setQuery('');
            }}
            className="mt-3 px-4 py-2 text-sm font-medium text-[#1D4ED8] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(({ company, eligible, profileCleared, missingReasons }) => (
            <article
              key={company.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      {company.visitDate} · {company.location}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">{company.name}</h2>
                    <p className="text-[15px] font-medium text-slate-700">{company.roleTitle}</p>
                  </div>
                  <div className="font-mono text-base font-semibold text-slate-900 tabular-nums shrink-0">
                    {company.ctcPackage}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{company.highlights}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
                  <div>
                    <span className="text-slate-500">Min CGPA:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {company.minCgpa.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Max Backlogs:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {company.maxBacklogs}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Min Assessment:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {company.minAssessmentPct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Min Trust Score:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {company.minTrustScore}/100
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Eligible Branches:</span>{' '}
                    <span className="text-slate-800">{company.allowedBranches.join(', ')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Required Skills:</span>{' '}
                    <span className="font-medium text-slate-800">
                      {company.requiredSkills.join(' · ')}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-lg border text-sm ${
                  eligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : profileCleared && !student.latestResult
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {eligible ? (
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Eligible &amp; Cleared All Criteria</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <XCircle className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>
                        {profileCleared && !student.latestResult
                          ? 'Profile Cleared — Assessment Pending'
                          : 'Criteria Not Fulfilled'}
                      </span>
                    </div>
                    <ul className="pl-6 list-disc text-xs space-y-0.5 text-slate-600">
                      {missingReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
