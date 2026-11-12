import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTION_POOL,
  SEEDED_STUDENTS,
  VISITING_COMPANIES,
  buildSampleResumePdfDataUrl,
} from '../data/seedData';
import {
  computeCompositeRankScore,
  evaluateAssessmentAttempt,
  evaluateCompanyEligibility,
  filterRecruiterCandidates,
  generateRandomAssessment,
  rankStudents,
  validateStudentSignup,
  verifyRolePasscode,
} from './placementLogic';

test('verifyRolePasscode enforces distinct passwords for each portal role', () => {
  assert.equal(verifyRolePasscode('student', 'STUDENT2026'), true);
  assert.equal(verifyRolePasscode('student', 'RECRUIT2026'), false);
  assert.equal(verifyRolePasscode('recruiter', 'RECRUIT2026'), true);
  assert.equal(verifyRolePasscode('placement', 'PLACEMENT2026'), true);
  assert.equal(verifyRolePasscode('placement', 'wrong'), false);
});

test('validateStudentSignup requires valid CGPA, skills, and PDF resume', () => {
  const samplePdf = buildSampleResumePdfDataUrl(['Test Resume']);
  const valid = validateStudentSignup({
    name: 'Priya Menon',
    email: 'priya@campus.edu',
    rollNumber: 'CS2401',
    branch: 'Computer Science',
    graduationYear: 2027,
    cgpa: 8.6,
    activeBacklogs: 0,
    skillsText: 'TypeScript, React, SQL',
    portfolioUrl: 'https://github.com/priya',
    resumeFileName: 'priya_resume.pdf',
    resumePdfDataUrl: samplePdf,
  });
  assert.equal(valid.valid, true);

  const invalid = validateStudentSignup({
    name: 'P',
    email: 'bad-email',
    rollNumber: '',
    branch: 'Computer Science',
    graduationYear: 2027,
    cgpa: 12.5,
    activeBacklogs: 0,
    skillsText: '',
    portfolioUrl: '',
    resumeFileName: '',
    resumePdfDataUrl: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.cgpa);
  assert.ok(invalid.errors.resume);
});

test('generateRandomAssessment returns balanced randomized questions across all 5 subjects', () => {
  const exam = generateRandomAssessment(QUESTION_POOL, 2);
  assert.equal(exam.length, 10);
  const subjects = new Set(exam.map((q) => q.subject));
  assert.equal(subjects.size, 5);
});

test('evaluateAssessmentAttempt calculates .75 assessment + .25 trust score and enforces min trust threshold', () => {
  assert.equal(computeCompositeRankScore(80, 100), 85);
  assert.equal(computeCompositeRankScore(60, 80), 65);

  const questions = generateRandomAssessment(QUESTION_POOL, 2);
  const allCorrect: Record<string, number> = {};
  for (const q of questions) {
    allCorrect[q.id] = q.correctIndex;
  }

  const highTrustResult = evaluateAssessmentAttempt({
    questions,
    answers: allCorrect,
    trustScore: 88,
    violations: [],
  });
  assert.equal(highTrustResult.assessmentPct, 100);
  assert.equal(highTrustResult.trustCleared, true);
  assert.equal(highTrustResult.compositeRankScore, 97);

  const lowTrustResult = evaluateAssessmentAttempt({
    questions,
    answers: allCorrect,
    trustScore: 45,
    violations: [
      {
        id: 'v1',
        type: 'tab-switch',
        timestamp: new Date().toISOString(),
        pointsDeducted: 55,
        detail: 'Multiple tab switches',
      },
    ],
  });
  assert.equal(lowTrustResult.trustCleared, false);
});

test('rankStudents orders candidates descending by 0.75 * Assessment + 0.25 * Trust', () => {
  const ranked = rankStudents(SEEDED_STUDENTS);
  assert.equal(ranked.length, SEEDED_STUDENTS.length);
  assert.equal(ranked[0].rank, 1);
  assert.ok(ranked[0].weightedScore >= ranked[1].weightedScore);
  assert.ok(ranked[1].weightedScore >= ranked[2].weightedScore);
});

test('evaluateCompanyEligibility & filterRecruiterCandidates accurately filter by company criteria and recommendations', () => {
  const stripe = VISITING_COMPANIES.find((c) => c.id === 'comp-stripe')!;
  const ananya = SEEDED_STUDENTS[0];
  const kabir = SEEDED_STUDENTS[3];

  const ananyaEval = evaluateCompanyEligibility(ananya, stripe);
  assert.equal(ananyaEval.eligible, true);

  const kabirEval = evaluateCompanyEligibility(kabir, stripe);
  assert.equal(kabirEval.eligible, false);
  assert.ok(kabirEval.missingReasons.length > 0);

  const ranked = rankStudents(SEEDED_STUDENTS);
  const stripeRecommended = filterRecruiterCandidates(
    ranked,
    {
      companyId: 'comp-stripe',
      minCgpa: 0,
      branch: 'all',
      skillQuery: '',
      maxBacklogs: 5,
      minWeightedScore: 0,
      recommendedOnly: true,
    },
    VISITING_COMPANIES
  );
  assert.equal(stripeRecommended.length, 1);
  assert.equal(stripeRecommended[0].student.id, 'stu-ananya');
});
