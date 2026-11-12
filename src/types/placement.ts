export type UserRole = 'student' | 'recruiter' | 'placement';

export type SubjectName =
  | 'Data Structures'
  | 'System Design'
  | 'Databases & SQL'
  | 'Web & APIs'
  | 'Aptitude & Logic';

export interface QuestionItem {
  id: string;
  subject: SubjectName;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SubjectProficiency {
  subject: SubjectName;
  correct: number;
  total: number;
  percentage: number;
}

export interface ProctoringViolation {
  id: string;
  type: 'tab-switch' | 'window-blur' | 'camera-blocked';
  timestamp: string;
  pointsDeducted: number;
  detail: string;
}

export interface AssessmentResult {
  attemptId: string;
  completedAt: string;
  totalCorrect: number;
  totalQuestions: number;
  assessmentPct: number;
  trustScore: number;
  minTrustRequired: number;
  trustCleared: boolean;
  compositeRankScore: number;
  subjectBreakdown: SubjectProficiency[];
  weakAreas: {
    subject: SubjectName;
    percentage: number;
    recommendation: string;
  }[];
  violations: ProctoringViolation[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  activeBacklogs: number;
  skills: string[];
  portfolioUrl: string;
  resumeFileName: string;
  resumePdfDataUrl: string;
  createdAt: string;
  latestResult: AssessmentResult | null;
  attemptHistoryCount: number;
  recommendedToCompanies: string[];
  placementNote: string;
}

export interface VisitingCompany {
  id: string;
  name: string;
  roleTitle: string;
  ctcPackage: string;
  location: string;
  visitDate: string;
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  requiredSkills: string[];
  minAssessmentPct: number;
  minTrustScore: number;
  highlights: string;
}

export interface CompanyEligibilityEvaluation {
  company: VisitingCompany;
  eligible: boolean;
  profileCleared: boolean;
  assessmentCleared: boolean;
  trustCleared: boolean;
  missingReasons: string[];
}

export interface RankedStudentEntry {
  rank: number;
  student: StudentProfile;
  assessmentPct: number;
  trustScore: number;
  weightedScore: number;
  hasCompletedAssessment: boolean;
  trustCleared: boolean;
}

export interface RecruiterFilterState {
  companyId: string;
  minCgpa: number;
  branch: string;
  skillQuery: string;
  maxBacklogs: number;
  minWeightedScore: number;
  recommendedOnly: boolean;
}

export interface StudentSignupInput {
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  activeBacklogs: number;
  skillsText: string;
  portfolioUrl: string;
  resumeFileName: string;
  resumePdfDataUrl: string;
}
