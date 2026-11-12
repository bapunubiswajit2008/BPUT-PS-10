import { AlertCircle, Briefcase, Building2, FileText, GraduationCap, KeyRound, Upload } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { BRANCH_OPTIONS, ROLE_PASSCODES } from '../data/seedData';
import type { StudentProfile, StudentSignupInput, UserRole } from '../types/placement';
import { validateStudentSignup } from '../utils/placementLogic';

interface AuthGatewayProps {
  students: StudentProfile[];
  onStudentAuthenticated: (student: StudentProfile, allStudents?: StudentProfile[]) => void;
  onRoleAuthenticated: (role: 'recruiter' | 'placement', label: string) => void;
}

export function AuthGateway({
  students,
  onStudentAuthenticated,
  onRoleAuthenticated,
}: AuthGatewayProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [studentMode, setStudentMode] = useState<'signup' | 'login'>('signup');

  // Shared passcode inputs (separate state per category)
  const [studentPasscode, setStudentPasscode] = useState('');
  const [recruiterPasscode, setRecruiterPasscode] = useState('');
  const [recruiterOrg, setRecruiterOrg] = useState('Stripe Talent Team');
  const [placementPasscode, setPlacementPasscode] = useState('');

  // Existing student login
  const [loginEmail, setLoginEmail] = useState(students[0]?.email ?? '');

  // New student signup fields
  const [signupForm, setSignupForm] = useState<StudentSignupInput>({
    name: '',
    email: '',
    rollNumber: '',
    branch: BRANCH_OPTIONS[0],
    graduationYear: 2027,
    cgpa: 8.4,
    activeBacklogs: 0,
    skillsText: 'TypeScript, React, SQL, Data Structures',
    portfolioUrl: '',
    resumeFileName: '',
    resumePdfDataUrl: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleRoleChange(role: UserRole) {
    setSelectedRole(role);
    setFormErrors({});
    setServerError('');
  }

  function handleResumeUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setFormErrors((prev) => ({
        ...prev,
        resume: 'Only PDF (.pdf) resume files are accepted.',
      }));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        resume: 'Resume PDF must be smaller than 4 MB.',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setSignupForm((prev) => ({
        ...prev,
        resumeFileName: file.name,
        resumePdfDataUrl: result,
      }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.resume;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleStudentSignupSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const validation = validateStudentSignup(signupForm);
    const nextErrors = { ...validation.errors };
    if (!studentPasscode.trim()) {
      nextErrors.studentPasscode = 'Enter the Student Portal password to proceed.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: studentPasscode,
          profile: signupForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFormErrors(data.errors);
        setServerError(data.error ?? 'Could not complete student registration.');
        return;
      }
      onStudentAuthenticated(data.student, data.students);
    } catch {
      setServerError('Network error while connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStudentLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');

    const nextErrors: Record<string, string> = {};
    if (!loginEmail.trim()) nextErrors.loginEmail = 'Enter your registered student email.';
    if (!studentPasscode.trim()) nextErrors.studentPasscode = 'Enter the Student Portal password.';

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/students/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          passcode: studentPasscode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? 'Login failed.');
        return;
      }
      onStudentAuthenticated(data.student, data.students);
    } catch {
      setServerError('Network error while connecting to server.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProtectedRoleSubmit(
    e: FormEvent,
    role: 'recruiter' | 'placement',
    passcode: string,
    label: string
  ) {
    e.preventDefault();
    setServerError('');

    if (!passcode.trim()) {
      setFormErrors({ passcode: `Enter the ${role === 'recruiter' ? 'Recruiter' : 'Placement Cell'} password.` });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? 'Incorrect access password.');
        return;
      }
      onRoleAuthenticated(role, label);
    } catch {
      setServerError('Network error while verifying password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-sm font-medium text-[#1D4ED8]">Unified Campus Recruitment Gateway</p>
            <h1
              className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Role-gated assessment, ranking, and hiring portal.
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Select your category to sign in with its dedicated access password. Students register with full academic credentials and resume PDF before taking the webcam-proctored assessment.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Portal Workflows</h2>
            <div className="space-y-3 text-[15px] text-slate-600">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-[#1D4ED8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900">Students:</span>{' '}
                  Take randomized skill tests with active webcam &amp; tab-switch trust scoring, view visiting company criteria, and unlock subject proficiency charts.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#1D4ED8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900">Placement Cell:</span>{' '}
                  Review cohort ranks weighted by <span className="font-mono text-sm text-slate-800">0.75 × Test + 0.25 × Trust</span> and recommend top students directly to recruiters.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-[#1D4ED8] mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-semibold text-slate-900">Recruiters:</span>{' '}
                  Filter verified students by company CGPA, branch, and skill criteria, inspect Placement Cell endorsements, and review uploaded PDF resumes.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Category Access Passwords</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Each portal enforces a distinct entry password. Use the credentials below to test any role:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="text-xs text-slate-400">Students</div>
                <div className="mt-1 font-mono text-sm font-semibold text-white">
                  {ROLE_PASSCODES.student}
                </div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="text-xs text-slate-400">Recruiters</div>
                <div className="mt-1 font-mono text-sm font-semibold text-white">
                  {ROLE_PASSCODES.recruiter}
                </div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3">
                <div className="text-xs text-slate-400">Placement Cell</div>
                <div className="mt-1 font-mono text-sm font-semibold text-white">
                  {ROLE_PASSCODES.placement}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div
            role="tablist"
            aria-label="Portal role categories"
            className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'student'}
              onClick={() => handleRoleChange('student')}
              className={`py-2.5 px-3 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                selectedRole === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Students
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'recruiter'}
              onClick={() => handleRoleChange('recruiter')}
              className={`py-2.5 px-3 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                selectedRole === 'recruiter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recruiters
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'placement'}
              onClick={() => handleRoleChange('placement')}
              className={`py-2.5 px-3 text-sm font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                selectedRole === 'placement'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Placement Cell
            </button>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          {selectedRole === 'student' && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Student Portal Entry</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Register your academic profile &amp; resume PDF, or sign back in with your email.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode('signup');
                      setFormErrors({});
                      setServerError('');
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      studentMode === 'signup'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Student Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentMode('login');
                      setFormErrors({});
                      setServerError('');
                    }}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      studentMode === 'login'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Returning Login
                  </button>
                </div>
              </div>

              {studentMode === 'signup' ? (
                <form onSubmit={handleStudentSignupSubmit} className="mt-6 space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stu-name" className="block text-sm font-medium text-slate-800">
                        Full Name
                      </label>
                      <input
                        id="stu-name"
                        type="text"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        placeholder="e.g. Aarav Mehta"
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="stu-email" className="block text-sm font-medium text-slate-800">
                        College Email
                      </label>
                      <input
                        id="stu-email"
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        placeholder="aarav@campus.edu"
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="stu-roll" className="block text-sm font-medium text-slate-800">
                        Roll / Registration Number
                      </label>
                      <input
                        id="stu-roll"
                        type="text"
                        value={signupForm.rollNumber}
                        onChange={(e) => setSignupForm({ ...signupForm, rollNumber: e.target.value })}
                        placeholder="CS23B055"
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                      {formErrors.rollNumber && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.rollNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="stu-branch" className="block text-sm font-medium text-slate-800">
                        Department / Branch
                      </label>
                      <select
                        id="stu-branch"
                        value={signupForm.branch}
                        onChange={(e) => setSignupForm({ ...signupForm, branch: e.target.value })}
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      >
                        {BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      {formErrors.branch && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.branch}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="stu-cgpa" className="block text-sm font-medium text-slate-800">
                        Current CGPA (out of 10)
                      </label>
                      <input
                        id="stu-cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={signupForm.cgpa}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, cgpa: parseFloat(e.target.value) })
                        }
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                      {formErrors.cgpa && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.cgpa}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="stu-grad" className="block text-sm font-medium text-slate-800">
                          Grad Year
                        </label>
                        <input
                          id="stu-grad"
                          type="number"
                          min="2024"
                          max="2032"
                          value={signupForm.graduationYear}
                          onChange={(e) =>
                            setSignupForm({
                              ...signupForm,
                              graduationYear: parseInt(e.target.value, 10),
                            })
                          }
                          className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                        />
                      </div>

                      <div>
                        <label htmlFor="stu-backlogs" className="block text-sm font-medium text-slate-800">
                          Backlogs
                        </label>
                        <input
                          id="stu-backlogs"
                          type="number"
                          min="0"
                          max="20"
                          value={signupForm.activeBacklogs}
                          onChange={(e) =>
                            setSignupForm({
                              ...signupForm,
                              activeBacklogs: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stu-skills" className="block text-sm font-medium text-slate-800">
                      Technical Skills (comma-separated)
                    </label>
                    <input
                      id="stu-skills"
                      type="text"
                      value={signupForm.skillsText}
                      onChange={(e) => setSignupForm({ ...signupForm, skillsText: e.target.value })}
                      placeholder="React, TypeScript, SQL, Distributed Systems, Node.js"
                      className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    {formErrors.skillsText && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.skillsText}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="stu-portfolio" className="block text-sm font-medium text-slate-800">
                        GitHub / Portfolio Link (optional)
                      </label>
                      <input
                        id="stu-portfolio"
                        type="url"
                        value={signupForm.portfolioUrl}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, portfolioUrl: e.target.value })
                        }
                        placeholder="https://github.com/username"
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                    </div>

                    <div>
                      <label htmlFor="stu-passcode" className="block text-sm font-medium text-slate-800">
                        Student Portal Password
                      </label>
                      <input
                        id="stu-passcode"
                        type="password"
                        value={studentPasscode}
                        onChange={(e) => setStudentPasscode(e.target.value)}
                        placeholder="Enter student password"
                        className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                      />
                      {formErrors.studentPasscode && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.studentPasscode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stu-resume-pdf" className="block text-sm font-medium text-slate-800">
                      Upload Resume (PDF only)
                    </label>
                    <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                      <label
                        htmlFor="stu-resume-pdf"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                      >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>Choose PDF File</span>
                      </label>
                      <input
                        id="stu-resume-pdf"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleResumeUpload}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {signupForm.resumeFileName
                            ? `Attached: ${signupForm.resumeFileName}`
                            : 'No PDF selected yet (required for recruiter screening)'}
                        </span>
                      </div>
                    </div>
                    {formErrors.resume && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.resume}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    {isSubmitting ? 'Registering Student Profile...' : 'Register & Enter Student Portal'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStudentLoginSubmit} className="mt-6 space-y-5" noValidate>
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-800">
                      Registered Student Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="ananya.sharma@campus.edu"
                      className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    {formErrors.loginEmail && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.loginEmail}</p>
                    )}

                    {students.length > 0 && (
                      <div className="mt-2.5">
                        <span className="text-sm text-slate-500">Quick select cohort student: </span>
                        <select
                          aria-label="Quick select registered student"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="ml-1 px-2.5 py-1 text-sm bg-slate-50 border border-slate-300 rounded-md"
                        >
                          {students.map((s) => (
                            <option key={s.id} value={s.email}>
                              {s.name} ({s.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="login-stu-pass" className="block text-sm font-medium text-slate-800">
                      Student Portal Password
                    </label>
                    <input
                      id="login-stu-pass"
                      type="password"
                      value={studentPasscode}
                      onChange={(e) => setStudentPasscode(e.target.value)}
                      placeholder="Enter student portal password"
                      className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                    />
                    {formErrors.studentPasscode && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.studentPasscode}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In to Student Portal'}
                  </button>
                </form>
              )}
            </div>
          )}

          {selectedRole === 'recruiter' && (
            <form
              onSubmit={(e) =>
                handleProtectedRoleSubmit(e, 'recruiter', recruiterPasscode, recruiterOrg)
              }
              className="mt-6 space-y-5"
              noValidate
            >
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Recruiter Portal Entry</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Access Placement Cell recommended candidates, filter by company criteria, and inspect PDF resumes.
                </p>
              </div>

              <div>
                <label htmlFor="rec-org" className="block text-sm font-medium text-slate-800">
                  Company / Recruiter Name
                </label>
                <input
                  id="rec-org"
                  type="text"
                  value={recruiterOrg}
                  onChange={(e) => setRecruiterOrg(e.target.value)}
                  className="mt-1.5 w-full px-3.5 py-2.5 text-base bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label htmlFor="rec-pass" className="block text-sm font-medium text-slate-800">
                  Recruiter Access Password
                </label>
                <input
                  id="rec-pass"
                  type="password"
                  value={recruiterPasscode}
                  onChange={(e) => setRecruiterPasscode(e.target.value)}
                  placeholder="Enter recruiter password"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
                {formErrors.passcode && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.passcode}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Verifying Password...' : 'Enter Recruiter Portal'}
              </button>
            </form>
          )}

          {selectedRole === 'placement' && (
            <form
              onSubmit={(e) =>
                handleProtectedRoleSubmit(
                  e,
                  'placement',
                  placementPasscode,
                  'Campus Placement Cell'
                )
              }
              className="mt-6 space-y-5"
              noValidate
            >
              <div className="pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Placement Cell Console Entry</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Inspect cohort ranks computed via <span className="font-mono text-slate-800">0.75 × Assessment + 0.25 × Trust</span> and recommend top students directly to recruiters.
                </p>
              </div>

              <div>
                <label htmlFor="plc-pass" className="block text-sm font-medium text-slate-800">
                  Placement Cell Password
                </label>
                <input
                  id="plc-pass"
                  type="password"
                  value={placementPasscode}
                  onChange={(e) => setPlacementPasscode(e.target.value)}
                  placeholder="Enter placement cell password"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-base font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
                {formErrors.passcode && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.passcode}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Verifying Password...' : 'Enter Placement Cell Console'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
