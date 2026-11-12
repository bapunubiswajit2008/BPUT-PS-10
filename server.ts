import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEEDED_STUDENTS, VISITING_COMPANIES } from './src/data/seedData';
import type { AssessmentResult, StudentProfile, StudentSignupInput, UserRole } from './src/types/placement';
import {
  parseSkillsList,
  validateStudentSignup,
  verifyRolePasscode,
} from './src/utils/placementLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');

let memoryStudents: StudentProfile[] = structuredClone(SEEDED_STUDENTS);

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Graceful memory fallback
  }
}

async function readStudents(): Promise<StudentProfile[]> {
  try {
    const raw = await fs.readFile(STUDENTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as StudentProfile[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      memoryStudents = parsed;
      return parsed;
    }
  } catch {
    // First launch: seed file does not exist yet
  }
  return memoryStudents;
}

async function writeStudents(students: StudentProfile[]): Promise<void> {
  memoryStudents = students;
  try {
    await ensureDataDir();
    await fs.writeFile(STUDENTS_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch {
    // Keep memory state if filesystem write fails
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/auth/verify', (req, res) => {
    const role = String(req.body?.role ?? '') as UserRole;
    const passcode = String(req.body?.passcode ?? '');
    if (!['student', 'recruiter', 'placement'].includes(role)) {
      res.status(400).json({ error: 'Invalid role selected.' });
      return;
    }
    if (!verifyRolePasscode(role, passcode)) {
      res.status(401).json({ error: `Invalid ${role} access password.` });
      return;
    }
    res.json({ ok: true, role });
  });

  app.get('/api/bootstrap', async (_req, res) => {
    const students = await readStudents();
    res.json({
      students,
      companies: VISITING_COMPANIES,
    });
  });

  app.post('/api/students/login', async (req, res) => {
    const passcode = String(req.body?.passcode ?? '');
    const email = String(req.body?.email ?? '').trim().toLowerCase();

    if (!verifyRolePasscode('student', passcode)) {
      res.status(401).json({ error: 'Invalid student portal password.' });
      return;
    }
    if (!email) {
      res.status(400).json({ error: 'Please enter your registered student email.' });
      return;
    }

    const students = await readStudents();
    const found = students.find((s) => s.email.toLowerCase() === email);
    if (!found) {
      res.status(404).json({
        error: 'No student profile found for that email. Switch to "New Student Sign Up" to register.',
      });
      return;
    }

    res.json({ student: found, students });
  });

  app.post('/api/students/register', async (req, res) => {
    const passcode = String(req.body?.passcode ?? '');
    if (!verifyRolePasscode('student', passcode)) {
      res.status(401).json({ error: 'Invalid student portal password.' });
      return;
    }

    const signup = req.body?.profile as StudentSignupInput | undefined;
    if (!signup) {
      res.status(400).json({ error: 'Missing student profile details.' });
      return;
    }

    const normalized: StudentSignupInput = {
      name: String(signup.name ?? '').trim(),
      email: String(signup.email ?? '').trim(),
      rollNumber: String(signup.rollNumber ?? '').trim(),
      branch: String(signup.branch ?? '').trim(),
      graduationYear: Number(signup.graduationYear),
      cgpa: Number(signup.cgpa),
      activeBacklogs: Number(signup.activeBacklogs ?? 0),
      skillsText: String(signup.skillsText ?? '').trim(),
      portfolioUrl: String(signup.portfolioUrl ?? '').trim(),
      resumeFileName: String(signup.resumeFileName ?? '').trim(),
      resumePdfDataUrl: String(signup.resumePdfDataUrl ?? ''),
    };

    const validation = validateStudentSignup(normalized);
    if (!validation.valid) {
      res.status(400).json({ error: 'Please fix the highlighted fields.', errors: validation.errors });
      return;
    }

    const students = await readStudents();
    const existingIdx = students.findIndex(
      (s) => s.email.toLowerCase() === normalized.email.toLowerCase()
    );

    const studentRecord: StudentProfile =
      existingIdx >= 0
        ? {
            ...students[existingIdx],
            name: normalized.name,
            rollNumber: normalized.rollNumber,
            branch: normalized.branch,
            graduationYear: normalized.graduationYear,
            cgpa: normalized.cgpa,
            activeBacklogs: normalized.activeBacklogs,
            skills: parseSkillsList(normalized.skillsText),
            portfolioUrl: normalized.portfolioUrl,
            resumeFileName: normalized.resumeFileName,
            resumePdfDataUrl: normalized.resumePdfDataUrl,
          }
        : {
            id: `stu-${Date.now()}`,
            name: normalized.name,
            email: normalized.email,
            rollNumber: normalized.rollNumber,
            branch: normalized.branch,
            graduationYear: normalized.graduationYear,
            cgpa: normalized.cgpa,
            activeBacklogs: normalized.activeBacklogs,
            skills: parseSkillsList(normalized.skillsText),
            portfolioUrl: normalized.portfolioUrl,
            resumeFileName: normalized.resumeFileName,
            resumePdfDataUrl: normalized.resumePdfDataUrl,
            createdAt: new Date().toISOString(),
            latestResult: null,
            attemptHistoryCount: 0,
            recommendedToCompanies: [],
            placementNote: '',
          };

    const nextStudents =
      existingIdx >= 0
        ? students.map((s, idx) => (idx === existingIdx ? studentRecord : s))
        : [studentRecord, ...students];

    await writeStudents(nextStudents);
    res.status(201).json({ student: studentRecord, students: nextStudents });
  });

  app.post('/api/students/:id/assessment', async (req, res) => {
    const studentId = req.params.id;
    const result = req.body?.result as AssessmentResult | undefined;
    if (!result || typeof result.assessmentPct !== 'number' || typeof result.trustScore !== 'number') {
      res.status(400).json({ error: 'Invalid assessment result payload.' });
      return;
    }

    const students = await readStudents();
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx < 0) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const updatedStudent: StudentProfile = {
      ...students[idx],
      latestResult: result,
      attemptHistoryCount: (students[idx].attemptHistoryCount ?? 0) + 1,
    };

    const nextStudents = students.map((s, i) => (i === idx ? updatedStudent : s));
    await writeStudents(nextStudents);
    res.json({ student: updatedStudent, students: nextStudents });
  });

  app.post('/api/placement/recommend', async (req, res) => {
    const studentId = String(req.body?.studentId ?? '');
    const companyIds = Array.isArray(req.body?.companyIds)
      ? req.body.companyIds.map((c: unknown) => String(c))
      : [];
    const placementNote = String(req.body?.placementNote ?? '').trim();

    const students = await readStudents();
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx < 0) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const updatedStudent: StudentProfile = {
      ...students[idx],
      recommendedToCompanies: Array.from(new Set(companyIds)),
      placementNote,
    };

    const nextStudents = students.map((s, i) => (i === idx ? updatedStudent : s));
    await writeStudents(nextStudents);
    res.json({ student: updatedStudent, students: nextStudents });
  });

  app.get('/api/students/:id/resume.pdf', async (req, res) => {
    const students = await readStudents();
    const student = students.find((s) => s.id === req.params.id);
    if (!student || !student.resumePdfDataUrl) {
      res.status(404).send('Resume PDF not found.');
      return;
    }

    const base64Match = student.resumePdfDataUrl.match(/^data:application\/pdf[^;]*;base64,(.+)$/i);
    if (!base64Match) {
      res.status(400).send('Invalid stored PDF format.');
      return;
    }

    const buffer = Buffer.from(base64Match[1], 'base64');
    const safeName = (student.resumeFileName || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    res.send(buffer);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`HireGate server running on http://0.0.0.0:${port}`);
  });
}

startServer();
