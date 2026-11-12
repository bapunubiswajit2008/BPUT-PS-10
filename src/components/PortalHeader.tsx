import { Lock, LogOut, ShieldCheck } from 'lucide-react';
import type { StudentProfile, UserRole } from '../types/placement';

export type StudentTab = 'assessment' | 'companies' | 'results';

interface PortalHeaderProps {
  activeRole: UserRole | null;
  currentStudent: StudentProfile | null;
  studentTab: StudentTab;
  onSelectStudentTab: (tab: StudentTab) => void;
  onSignOut: () => void;
}

export function PortalHeader({
  activeRole,
  currentStudent,
  studentTab,
  onSelectStudentTab,
  onSignOut,
}: PortalHeaderProps) {
  const hasAttempted = Boolean(currentStudent?.latestResult);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#1D4ED8] text-white shrink-0">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="font-bold text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            HireGate
          </span>
        </div>

        {activeRole === 'student' && (
          <nav
            aria-label="Student portal sections"
            className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              onClick={() => onSelectStudentTab('assessment')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                studentTab === 'assessment'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assessment Test
            </button>
            <button
              type="button"
              onClick={() => onSelectStudentTab('companies')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                studentTab === 'companies'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Companies Visiting
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasAttempted) onSelectStudentTab('results');
              }}
              aria-disabled={!hasAttempted}
              title={hasAttempted ? 'View your assessment results' : 'Complete the assessment test first to unlock results'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                !hasAttempted
                  ? 'text-slate-400 cursor-not-allowed'
                  : studentTab === 'results'
                  ? 'bg-white text-slate-900 shadow-xs cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 cursor-pointer'
              }`}
            >
              {!hasAttempted && <Lock className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>Result</span>
            </button>
          </nav>
        )}

        {activeRole === 'placement' && (
          <div className="hidden sm:block text-sm font-medium text-slate-600 whitespace-nowrap">
            Placement Cell Console · Rank &amp; Recruiter Endorsements
          </div>
        )}

        {activeRole === 'recruiter' && (
          <div className="hidden sm:block text-sm font-medium text-slate-600 whitespace-nowrap">
            Recruiter Talent Portal · Shortlist &amp; Resume Review
          </div>
        )}

        {!activeRole && (
          <div className="hidden sm:block text-sm font-medium text-slate-500 whitespace-nowrap">
            Campus Placement, Proctoring &amp; Recruitment Portal
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {activeRole ? (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <LogOut className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap shrink-0">
              Select Role Below
            </span>
          )}
        </div>
      </div>

      {activeRole === 'student' && (
        <nav
          aria-label="Mobile student sections"
          className="md:hidden border-t border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-1 overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => onSelectStudentTab('assessment')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 ${
              studentTab === 'assessment'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Assessment Test
          </button>
          <button
            type="button"
            onClick={() => onSelectStudentTab('companies')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 ${
              studentTab === 'companies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            Companies Visiting
          </button>
          <button
            type="button"
            onClick={() => {
              if (hasAttempted) onSelectStudentTab('results');
            }}
            aria-disabled={!hasAttempted}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap shrink-0 ${
              !hasAttempted
                ? 'text-slate-400 cursor-not-allowed'
                : studentTab === 'results'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600'
            }`}
          >
            {!hasAttempted && <Lock className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>Result</span>
          </button>
        </nav>
      )}
    </header>
  );
}
