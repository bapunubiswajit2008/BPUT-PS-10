import { useEffect, useState } from 'react';
import { AuthGateway } from './components/AuthGateway';
import { PlacementCellPortal } from './components/PlacementCellPortal';
import { PortalHeader, type StudentTab } from './components/PortalHeader';
import { RecruiterPortal } from './components/RecruiterPortal';
import { StudentAssessmentTab } from './components/StudentAssessmentTab';
import { StudentCompaniesTab } from './components/StudentCompaniesTab';
import { StudentResultsTab } from './components/StudentResultsTab';
import { SEEDED_STUDENTS, VISITING_COMPANIES } from './data/seedData';
import type {
  AssessmentResult,
  StudentProfile,
  UserRole,
  VisitingCompany,
} from './types/placement';

export default function App() {
  const [students, setStudents] = useState<StudentProfile[]>(SEEDED_STUDENTS);
  const [companies, setCompanies] = useState<VisitingCompany[]>(VISITING_COMPANIES);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [roleOrgLabel, setRoleOrgLabel] = useState<string>('');
  const [studentTab, setStudentTab] = useState<StudentTab>('assessment');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadBootstrap() {
      try {
        const res = await fetch('/api/bootstrap');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            if (Array.isArray(data.students) && data.students.length > 0) {
              setStudents(data.students);
            }
            if (Array.isArray(data.companies) && data.companies.length > 0) {
              setCompanies(data.companies);
            }
          }
        }
      } catch {
        // Fallback smoothly to initial seeded dataset
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadBootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  // Optional ?autostart=1 support for quick testing of authenticated student view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !activeRole && students.length > 0) {
      setActiveRole('student');
      setCurrentStudentId(students[0].id);
      setStudentTab('assessment');
    }
  }, [activeRole, students]);

  const currentStudent =
    students.find((s) => s.id === currentStudentId) ?? null;

  function handleStudentAuthenticated(
    student: StudentProfile,
    updatedList?: StudentProfile[]
  ) {
    if (updatedList) {
      setStudents(updatedList);
    } else {
      setStudents((prev) => {
        const exists = prev.some((s) => s.id === student.id);
        return exists
          ? prev.map((s) => (s.id === student.id ? student : s))
          : [student, ...prev];
      });
    }
    setCurrentStudentId(student.id);
    setActiveRole('student');
    setStudentTab('assessment');
  }

  function handleRoleAuthenticated(role: 'recruiter' | 'placement', label: string) {
    setActiveRole(role);
    setRoleOrgLabel(label);
  }

  async function handleAssessmentSubmitted(result: AssessmentResult) {
    if (!currentStudent) return;
    try {
      const res = await fetch(`/api/students/${currentStudent.id}/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.students)) {
          setStudents(data.students);
        }
      } else {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === currentStudent.id
              ? {
                  ...s,
                  latestResult: result,
                  attemptHistoryCount: s.attemptHistoryCount + 1,
                }
              : s
          )
        );
      }
    } catch {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentStudent.id
            ? {
                ...s,
                latestResult: result,
                attemptHistoryCount: s.attemptHistoryCount + 1,
              }
            : s
        )
      );
    }
    setStudentTab('results');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleSelectStudentTab(tab: StudentTab) {
    setStudentTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function handleSaveRecommendation(
    studentId: string,
    companyIds: string[],
    placementNote: string
  ) {
    try {
      const res = await fetch('/api/placement/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, companyIds, placementNote }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.students)) {
          setStudents(data.students);
          return;
        }
      }
    } catch {
      // Fallback local state update
    }
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, recommendedToCompanies: companyIds, placementNote }
          : s
      )
    );
  }

  function handleSignOut() {
    setActiveRole(null);
    setCurrentStudentId(null);
    setRoleOrgLabel('');
    setStudentTab('assessment');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <PortalHeader
        activeRole={activeRole}
        currentStudent={currentStudent}
        studentTab={studentTab}
        onSelectStudentTab={handleSelectStudentTab}
        onSignOut={handleSignOut}
      />

      {isLoading ? (
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-base text-slate-600">
            Loading placement portal...
          </div>
        </main>
      ) : !activeRole ? (
        <div className="flex-1">
          <AuthGateway
            students={students}
            onStudentAuthenticated={handleStudentAuthenticated}
            onRoleAuthenticated={handleRoleAuthenticated}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeRole === 'student' && currentStudent && (
            <>
              {studentTab === 'assessment' && (
                <StudentAssessmentTab
                  student={currentStudent}
                  onAssessmentSubmitted={handleAssessmentSubmitted}
                />
              )}
              {studentTab === 'companies' && (
                <StudentCompaniesTab student={currentStudent} companies={companies} />
              )}
              {studentTab === 'results' && (
                <StudentResultsTab
                  student={currentStudent}
                  companies={companies}
                  onGoToAssessment={() => setStudentTab('assessment')}
                />
              )}
            </>
          )}

          {activeRole === 'placement' && (
            <PlacementCellPortal
              students={students}
              companies={companies}
              onSaveRecommendation={handleSaveRecommendation}
            />
          )}

          {activeRole === 'recruiter' && (
            <RecruiterPortal
              recruiterOrg={roleOrgLabel || 'Recruiter Partner'}
              students={students}
              companies={companies}
            />
          )}
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white py-5 mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>HireGate Campus Placement &amp; Assessment System</span>
          <span>Students · Recruiters · Placement Cell</span>
        </div>
      </footer>
    </div>
  );
}
