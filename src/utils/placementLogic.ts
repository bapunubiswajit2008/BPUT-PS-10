import { MIN_TRUST_REQUIRED, ROLE_PASSCODES, SUBJECT_LIST } from '../data/seedData';
import type {
  AssessmentResult,
  CompanyEligibilityEvaluation,
  ProctoringViolation,
  QuestionItem,
  RankedStudentEntry,
  RecruiterFilterState,
  StudentProfile,
  StudentSignupInput,
  SubjectName,
  SubjectProficiency,
  UserRole,
  VisitingCompany,
} from '../types/placement';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECT_RECOMMENDATIONS: Record<SubjectName, string> = {
  'Data Structures': 'Review balanced trees, graph shortest paths, and LRU cache composition.',
  'System Design': 'Practice circuit breakers, consistent hashing, and idempotent API design.',
  'Databases & SQL': 'Focus on B-Tree indexing, 3NF normalization, and N+1 query elimination.',
  'Web & APIs': 'Reinforce HTTP status semantics, CORS preflight rules, and HttpOnly security.',
  'Aptitude & Logic': 'Drill timed throughput math, probability ratios, and sequence patterns.',
};

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function verifyRolePasscode(role: UserRole, passcode: string): boolean {
  return passcode.trim() === ROLE_PASSCODES[role];
}

export function parseSkillsList(skillsText: string): string[] {
  return Array.from(
    new Set(
      skillsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  );
}

export function validateStudentSignup(input: StudentSignupInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  }
  if (!input.email || !EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Please enter a valid college or personal email.';
  }
  if (!input.rollNumber || input.rollNumber.trim().length < 3) {
    errors.rollNumber = 'Roll / Registration number is required.';
  }
  if (!input.branch || !input.branch.trim()) {
    errors.branch = 'Please select your academic department.';
  }
  if (Number.isNaN(input.cgpa) || input.cgpa < 0 || input.cgpa > 10) {
    errors.cgpa = 'CGPA must be between 0.0 and 10.0.';
  }
  if (Number.isNaN(input.graduationYear) || input.graduationYear < 2024 || input.graduationYear > 2032) {
    errors.graduationYear = 'Graduation year must be between 2024 and 2032.';
  }
  if (Number.isNaN(input.activeBacklogs) || input.activeBacklogs < 0 || input.activeBacklogs > 20) {
    errors.activeBacklogs = 'Active backlogs must be 0 or greater.';
  }
  if (parseSkillsList(input.skillsText).length === 0) {
    errors.skillsText = 'Enter at least one skill (comma-separated, e.g. React, SQL, Python).';
  }
  if (!input.resumeFileName || !input.resumePdfDataUrl.startsWith('data:application/pdf')) {
    errors.resume = 'Please upload your resume as a PDF file (.pdf).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateRandomAssessment(
  pool: QuestionItem[],
  questionsPerSubject = 2,
  rng: () => number = Math.random
): QuestionItem[] {
  const picked: QuestionItem[] = [];

  for (const subject of SUBJECT_LIST) {
    const subjectItems = pool.filter((q) => q.subject === subject).slice();
    for (let i = subjectItems.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [subjectItems[i], subjectItems[j]] = [subjectItems[j], subjectItems[i]];
    }
    picked.push(...subjectItems.slice(0, questionsPerSubject));
  }

  // Shuffle final exam sequence so subjects are interleaved unpredictably
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked;
}

export function computeCompositeRankScore(assessmentPct: number, trustScore: number): number {
  const clampedAssessment = Math.max(0, Math.min(100, assessmentPct));
  const clampedTrust = Math.max(0, Math.min(100, trustScore));
  return round2(clampedAssessment * 0.75 + clampedTrust * 0.25);
}

export function evaluateAssessmentAttempt(params: {
  questions: QuestionItem[];
  answers: Record<string, number>;
  trustScore: number;
  violations: ProctoringViolation[];
  attemptNumber?: number;
  completedAt?: string;
}): AssessmentResult {
  const {
    questions,
    answers,
    trustScore,
    violations,
    attemptNumber = 1,
    completedAt = new Date().toISOString(),
  } = params;

  const clampedTrust = Math.max(0, Math.min(100, Math.round(trustScore)));
  let totalCorrect = 0;

  const subjectMap = new Map<SubjectName, { correct: number; total: number }>();
  for (const subject of SUBJECT_LIST) {
    subjectMap.set(subject, { correct: 0, total: 0 });
  }

  for (const q of questions) {
    const entry = subjectMap.get(q.subject) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answers[q.id] === q.correctIndex) {
      entry.correct += 1;
      totalCorrect += 1;
    }
    subjectMap.set(q.subject, entry);
  }

  const totalQuestions = questions.length;
  const assessmentPct = totalQuestions > 0 ? round1((totalCorrect / totalQuestions) * 100) : 0;

  const subjectBreakdown: SubjectProficiency[] = SUBJECT_LIST.map((subject) => {
    const stat = subjectMap.get(subject) ?? { correct: 0, total: 0 };
    const percentage = stat.total > 0 ? round1((stat.correct / stat.total) * 100) : 0;
    return {
      subject,
      correct: stat.correct,
      total: stat.total,
      percentage,
    };
  });

  const sortedByWeakest = subjectBreakdown
    .slice()
    .sort((a, b) => a.percentage - b.percentage);

  const weakCandidates = sortedByWeakest.filter((s) => s.percentage < 75);
  const weakAreas = (weakCandidates.length > 0 ? weakCandidates : sortedByWeakest.slice(0, 2)).map(
    (s) => ({
      subject: s.subject,
      percentage: s.percentage,
      recommendation: SUBJECT_RECOMMENDATIONS[s.subject],
    })
  );

  const trustCleared = clampedTrust >= MIN_TRUST_REQUIRED;
  const compositeRankScore = computeCompositeRankScore(assessmentPct, clampedTrust);

  return {
    attemptId: `att-${Date.now()}-${attemptNumber}`,
    completedAt,
    totalCorrect,
    totalQuestions,
    assessmentPct,
    trustScore: clampedTrust,
    minTrustRequired: MIN_TRUST_REQUIRED,
    trustCleared,
    compositeRankScore,
    subjectBreakdown,
    weakAreas,
    violations,
  };
}

export function evaluateCompanyEligibility(
  student: StudentProfile,
  company: VisitingCompany
): CompanyEligibilityEvaluation {
  const missingReasons: string[] = [];

  if (student.cgpa < company.minCgpa) {
    missingReasons.push(`CGPA ${student.cgpa.toFixed(2)} below minimum ${company.minCgpa.toFixed(1)}`);
  }
  if (!company.allowedBranches.includes(student.branch)) {
    missingReasons.push(`Branch "${student.branch}" not in eligible branches`);
  }
  if (student.activeBacklogs > company.maxBacklogs) {
    missingReasons.push(
      `${student.activeBacklogs} active backlog(s) exceeds max allowed (${company.maxBacklogs})`
    );
  }

  const studentSkillsLower = student.skills.map((s) => s.toLowerCase());
  const matchedSkills = company.requiredSkills.filter((req) =>
    studentSkillsLower.some((s) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
  );
  const requiredSkillMatches = Math.min(2, company.requiredSkills.length);
  if (matchedSkills.length < requiredSkillMatches) {
    missingReasons.push(
      `Needs at least ${requiredSkillMatches} of: ${company.requiredSkills.join(', ')}`
    );
  }

  const profileCleared = missingReasons.length === 0;

  let assessmentCleared = false;
  let trustCleared = false;

  if (!student.latestResult) {
    missingReasons.push('Assessment test not completed yet');
  } else {
    trustCleared =
      student.latestResult.trustCleared &&
      student.latestResult.trustScore >= company.minTrustScore;
    if (!student.latestResult.trustCleared) {
      missingReasons.push(
        `Trust score ${student.latestResult.trustScore} below portal minimum (${MIN_TRUST_REQUIRED})`
      );
    } else if (student.latestResult.trustScore < company.minTrustScore) {
      missingReasons.push(
        `Trust score ${student.latestResult.trustScore} below company minimum (${company.minTrustScore})`
      );
    }

    assessmentCleared = student.latestResult.assessmentPct >= company.minAssessmentPct;
    if (!assessmentCleared) {
      missingReasons.push(
        `Assessment score ${student.latestResult.assessmentPct}% below required ${company.minAssessmentPct}%`
      );
    }
  }

  return {
    company,
    eligible: profileCleared && assessmentCleared && trustCleared,
    profileCleared,
    assessmentCleared,
    trustCleared,
    missingReasons,
  };
}

export function rankStudents(students: StudentProfile[]): RankedStudentEntry[] {
  const entries = students.map((student) => {
    const hasCompletedAssessment = student.latestResult !== null;
    const assessmentPct = student.latestResult?.assessmentPct ?? 0;
    const trustScore = student.latestResult?.trustScore ?? 0;
    const weightedScore = hasCompletedAssessment
      ? computeCompositeRankScore(assessmentPct, trustScore)
      : 0;
    const trustCleared = student.latestResult?.trustCleared ?? false;

    return {
      rank: 0,
      student,
      assessmentPct,
      trustScore,
      weightedScore,
      hasCompletedAssessment,
      trustCleared,
    };
  });

  entries.sort((a, b) => {
    if (a.hasCompletedAssessment !== b.hasCompletedAssessment) {
      return a.hasCompletedAssessment ? -1 : 1;
    }
    if (b.weightedScore !== a.weightedScore) {
      return b.weightedScore - a.weightedScore;
    }
    if (b.student.cgpa !== a.student.cgpa) {
      return b.student.cgpa - a.student.cgpa;
    }
    return a.student.name.localeCompare(b.student.name);
  });

  return entries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export function filterRecruiterCandidates(
  ranked: RankedStudentEntry[],
  filters: RecruiterFilterState,
  companies: VisitingCompany[]
): RankedStudentEntry[] {
  const selectedCompany =
    filters.companyId !== 'all'
      ? companies.find((c) => c.id === filters.companyId) ?? null
      : null;

  return ranked.filter((entry) => {
    const s = entry.student;

    if (filters.recommendedOnly) {
      if (selectedCompany) {
        if (!s.recommendedToCompanies.includes(selectedCompany.id)) return false;
      } else if (s.recommendedToCompanies.length === 0) {
        return false;
      }
    }

    if (s.cgpa < filters.minCgpa) return false;
    if (filters.branch !== 'all' && s.branch !== filters.branch) return false;
    if (s.activeBacklogs > filters.maxBacklogs) return false;
    if (entry.weightedScore < filters.minWeightedScore) return false;

    if (selectedCompany) {
      if (!selectedCompany.allowedBranches.includes(s.branch)) return false;
      if (s.cgpa < selectedCompany.minCgpa) return false;
      if (s.activeBacklogs > selectedCompany.maxBacklogs) return false;
      if (entry.hasCompletedAssessment) {
        if (entry.assessmentPct < selectedCompany.minAssessmentPct) return false;
        if (entry.trustScore < selectedCompany.minTrustScore) return false;
      }
    }

    const q = filters.skillQuery.trim().toLowerCase();
    if (q) {
      const tokens = q
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const studentSkills = s.skills.map((sk) => sk.toLowerCase());
      const matchesQuery = tokens.some((token) =>
        studentSkills.some((sk) => sk.includes(token)) || s.name.toLowerCase().includes(token)
      );
      if (!matchesQuery) return false;
    }

    return true;
  });
}
