import { AlertOctagon, CheckCircle2, Lock, RefreshCw, TrendingUp, XCircle } from 'lucide-react';
import type { StudentProfile, SubjectProficiency, VisitingCompany } from '../types/placement';
import { evaluateCompanyEligibility } from '../utils/placementLogic';

interface StudentResultsTabProps {
  student: StudentProfile;
  companies: VisitingCompany[];
  onGoToAssessment: () => void;
}

function SubjectRadarChart({ breakdown }: { breakdown: SubjectProficiency[] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 96;
  const levels = [25, 50, 75, 100];
  const count = breakdown.length || 5;

  const getPoint = (index: number, pct: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, pct)) / 100) * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxRadius + 24) * Math.cos(angle),
      labelY: cy + (maxRadius + 24) * Math.sin(angle),
    };
  };

  const polygonPoints = breakdown
    .map((item, idx) => {
      const pt = getPoint(idx, item.percentage);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const shortLabels: Record<string, string> = {
    'Data Structures': 'DSA',
    'System Design': 'Systems',
    'Databases & SQL': 'SQL',
    'Web & APIs': 'Web APIs',
    'Aptitude & Logic': 'Aptitude',
  };

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar chart showing proficiency across 5 technical subjects"
      className="w-full max-w-[290px] mx-auto overflow-visible"
    >
      {levels.map((lvl) => {
        const pts = Array.from({ length: count })
          .map((_, idx) => {
            const pt = getPoint(idx, lvl);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        );
      })}

      {breakdown.map((item, idx) => {
        const outer = getPoint(idx, 100);
        return (
          <g key={item.subject}>
            <line
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <text
              x={outer.labelX}
              y={outer.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-700 text-[11px] font-medium"
            >
              {shortLabels[item.subject] ?? item.subject}
            </text>
          </g>
        );
      })}

      <polygon
        points={polygonPoints}
        fill="rgba(29, 78, 216, 0.16)"
        stroke="#1D4ED8"
        strokeWidth="2"
      />

      {breakdown.map((item, idx) => {
        const pt = getPoint(idx, item.percentage);
        return (
          <circle
            key={item.subject}
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="#1D4ED8"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

export function StudentResultsTab({
  student,
  companies,
  onGoToAssessment,
}: StudentResultsTabProps) {
  const result = student.latestResult;

  if (!result) {
    return (
      <section className="max-w-[720px] mx-auto bg-white border border-slate-200 rounded-xl p-8 sm:p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Result Section Locked</h1>
        <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
          Complete the proctored skill assessment test first to unlock your marks, subject proficiency graphs, and matched visiting companies.
        </p>
        <button
          type="button"
          onClick={onGoToAssessment}
          className="mt-2 inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer"
        >
          <span>Go to Assessment Test</span>
        </button>
      </section>
    );
  }

  if (!result.trustCleared) {
    return (
      <section className="max-w-[820px] mx-auto bg-white border border-red-200 rounded-xl p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">Proctoring Integrity Hold</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Result Withheld — Minimum Trust Score ({result.minTrustRequired}) Not Met
            </h1>
            <p className="mt-2 text-base text-slate-600 leading-relaxed">
              Your latest assessment achieved a trust score of{' '}
              <span className="font-mono font-bold text-red-700">{result.trustScore} / 100</span>,
              which is below the required <span className="font-mono font-semibold">{result.minTrustRequired}</span> points due to tab switching or camera blocking.
            </p>
          </div>
        </div>

        {result.violations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <h2 className="text-sm font-semibold text-red-900">Recorded Proctoring Alerts</h2>
            <ul className="space-y-1.5 text-sm text-red-800">
              {result.violations.map((v) => (
                <li key={v.id} className="font-mono text-xs sm:text-sm">
                  [-{v.pointsDeducted} pts] {v.timestamp} — {v.detail}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onGoToAssessment}
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Retake Assessment &amp; Maintain Webcam Focus</span>
        </button>
      </section>
    );
  }

  const companyMatches = companies
    .map((c) => evaluateCompanyEligibility(student, c))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible));

  const clearedCount = companyMatches.filter((m) => m.eligible).length;

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-[#1D4ED8]">
              Attempt #{student.attemptHistoryCount} · Completed{' '}
              {new Date(result.completedAt).toLocaleString()}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Assessment Performance &amp; Company Fit
            </h1>
          </div>
          <button
            type="button"
            onClick={onGoToAssessment}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retake Test (New Questions)</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Total Marks</div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {result.totalCorrect} / {result.totalQuestions}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-600 font-mono tabular-nums">
              {result.assessmentPct}% accuracy
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Proctoring Trust Score</div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
              {result.trustScore} / 100
            </div>
            <div className="mt-1 text-sm font-medium text-emerald-700">
              Cleared (Min {result.minTrustRequired})
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Placement Rank Index</div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#1D4ED8] tabular-nums">
              {result.compositeRankScore.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono">
              0.75 × Test + 0.25 × Trust
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-600">Companies Cleared</div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {clearedCount} / {companies.length}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Based on profile + test marks
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Subject Proficiency Breakdown</h2>
            <span className="text-sm text-slate-500">Target benchmark: 70%</span>
          </div>

          <div className="space-y-4">
            {result.subjectBreakdown.map((item) => {
              const barColor =
                item.percentage >= 75
                  ? 'bg-emerald-600'
                  : item.percentage >= 50
                  ? 'bg-[#1D4ED8]'
                  : 'bg-amber-600';
              return (
                <div key={item.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{item.subject}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {item.correct}/{item.total} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="relative h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                    <div
                      title="70% Benchmark"
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-700/60"
                      style={{ left: '70%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Skill Balance Radar</h2>
            <p className="mt-1 text-sm text-slate-600">
              Visual spread across all five evaluated engineering &amp; aptitude domains.
            </p>
          </div>
          <div className="py-4">
            <SubjectRadarChart breakdown={result.subjectBreakdown} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-900">Areas Needing Work</h2>
          </div>
          <div className="space-y-3">
            {result.weakAreas.map((area) => (
              <div
                key={area.subject}
                className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1"
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>{area.subject}</span>
                  <span className="font-mono text-amber-800 tabular-nums">{area.percentage}%</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{area.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Best-Matched Companies &amp; Criteria Status
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Evaluated against your CGPA, branch, skills, assessment score ({result.assessmentPct}%), and trust score ({result.trustScore}).
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {companyMatches.map(({ company, eligible, missingReasons }) => (
              <div key={company.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-slate-900">
                      {company.name} — {company.roleTitle}
                    </div>
                    <div className="text-sm text-slate-500 font-mono tabular-nums">
                      {company.ctcPackage} · Min Test {company.minAssessmentPct}% · Min CGPA {company.minCgpa.toFixed(1)}
                    </div>
                  </div>

                  {eligible ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 shrink-0 w-fit">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span>Cleared / Best Fit</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 shrink-0 w-fit">
                      <XCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
                      <span>Criteria Not Fulfilled</span>
                    </span>
                  )}
                </div>

                {!eligible && missingReasons.length > 0 && (
                  <p className="text-sm text-slate-600">
                    Gap: {missingReasons.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
