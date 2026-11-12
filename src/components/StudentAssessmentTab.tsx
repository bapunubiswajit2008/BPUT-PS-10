import { AlertTriangle, Camera, CameraOff, CheckCircle2, Play, ShieldAlert, Video } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_TRUST_REQUIRED, QUESTION_POOL } from '../data/seedData';
import type {
  AssessmentResult,
  ProctoringViolation,
  QuestionItem,
  StudentProfile,
} from '../types/placement';
import { evaluateAssessmentAttempt, generateRandomAssessment } from '../utils/placementLogic';

interface StudentAssessmentTabProps {
  student: StudentProfile;
  onAssessmentSubmitted: (result: AssessmentResult) => Promise<void>;
}

export function StudentAssessmentTab({
  student,
  onAssessmentSubmitted,
}: StudentAssessmentTabProps) {
  const [phase, setPhase] = useState<'briefing' | 'active'>('briefing');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [trustScore, setTrustScore] = useState<number>(100);
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'active' | 'blocked' | 'unavailable'>(
    'idle'
  );
  const [cameraNotice, setCameraNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastTabPenaltyAtRef = useRef<number>(0);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const recordViolation = useCallback(
    (type: ProctoringViolation['type'], pointsDeducted: number, detail: string) => {
      const entry: ProctoringViolation = {
        id: `viol-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        pointsDeducted,
        detail,
      };
      setTrustScore((prev) => Math.max(0, prev - pointsDeducted));
      setViolations((prev) => [entry, ...prev]);
    },
    []
  );

  const requestWebcam = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unavailable');
      setCameraNotice('Browser camera API unavailable; proctoring continues with tab-switch monitoring.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('active');
      setCameraNotice('Live webcam proctoring active.');

      // Detect if user revokes or stops hardware camera track mid-test
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraStatus('blocked');
          setCameraNotice('Webcam stream stopped during test (-20 Trust Points).');
          recordViolation('camera-blocked', 20, 'Webcam feed ended or blocked during assessment.');
        };
      });
    } catch {
      setCameraStatus('unavailable');
      setCameraNotice(
        'Camera permission denied or no physical camera detected (-10 Trust Points). Keep this tab focused.'
      );
      recordViolation('camera-blocked', 10, 'Webcam access denied or unavailable at test start.');
    }
  }, [recordViolation]);

  useEffect(() => {
    if (phase === 'active' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase]);

  // Monitor tab switching & window focus loss while test is active
  useEffect(() => {
    if (phase !== 'active') return;

    const triggerTabPenalty = (type: 'tab-switch' | 'window-blur', detail: string) => {
      const now = Date.now();
      if (now - lastTabPenaltyAtRef.current < 1500) return;
      lastTabPenaltyAtRef.current = now;
      recordViolation(type, 15, detail);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabPenalty('tab-switch', 'Switched away from assessment browser tab (-15 pts).');
      }
    };

    const handleWindowBlur = () => {
      triggerTabPenalty('window-blur', 'Assessment window lost active focus (-15 pts).');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [phase, recordViolation]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  async function handleStartAssessment() {
    const freshQuestions = generateRandomAssessment(QUESTION_POOL, 2);
    setQuestions(freshQuestions);
    setAnswers({});
    setTrustScore(100);
    setViolations([]);
    setCameraNotice('');
    setPhase('active');
    await requestWebcam();
  }

  async function handleToggleCameraBlock() {
    if (cameraStatus === 'active') {
      stopCameraStream();
      setCameraStatus('blocked');
      setCameraNotice('Camera blocked by candidate during exam (-20 Trust Points).');
      recordViolation('camera-blocked', 20, 'Candidate blocked/muted webcam during active test.');
    } else {
      await requestWebcam();
    }
  }

  async function handleFinishAssessment() {
    setIsSubmitting(true);
    stopCameraStream();
    const evaluated = evaluateAssessmentAttempt({
      questions,
      answers,
      trustScore,
      violations,
      attemptNumber: (student.attemptHistoryCount ?? 0) + 1,
    });
    await onAssessmentSubmitted(evaluated);
    setIsSubmitting(false);
    setPhase('briefing');
  }

  const answeredCount = Object.keys(answers).length;
  const trustTone =
    trustScore >= 80
      ? { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Verified Standing' }
      : trustScore >= MIN_TRUST_REQUIRED
      ? { text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Warning Zone' }
      : {
          text: 'text-red-700',
          bg: 'bg-red-50 border-red-200',
          label: 'Below Minimum — Result Will Be Withheld',
        };

  if (phase === 'briefing') {
    return (
      <section className="max-w-[960px] mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <p className="text-sm font-medium text-[#1D4ED8]">
                Candidate: {student.name} · {student.rollNumber}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Proctored Skill Assessment
              </h1>
            </div>
            <div className="text-sm text-slate-600 font-mono tabular-nums">
              Attempts completed: {student.attemptHistoryCount}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-sm font-semibold text-slate-900">Randomized Question Pool</div>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                10 randomized questions across Data Structures, System Design, SQL, Web APIs, and Aptitude on every attempt.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-sm font-semibold text-slate-900">Active Webcam &amp; Tab Monitor</div>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Webcam stays active throughout the exam. Switching tabs deducts 15 Trust Points; blocking camera deducts 20.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-sm font-semibold text-slate-900">
                Minimum Trust Required: {MIN_TRUST_REQUIRED}
              </div>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                You need at least {MIN_TRUST_REQUIRED}/100 Trust Points to unlock your Results &amp; Placement Rank (0.75 Test + 0.25 Trust).
              </p>
            </div>
          </div>

          {student.latestResult && (
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Last Attempt:</span>{' '}
                <span className="font-mono tabular-nums">
                  {student.latestResult.assessmentPct}% Score · {student.latestResult.trustScore}/100 Trust
                </span>{' '}
                — Starting a new test generates fresh questions and updates your Result page.
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleStartAssessment}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>
                {student.latestResult ? 'Retake Assessment (New Questions)' : 'Start Proctored Assessment'}
              </span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Active Skill Assessment
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Answer all {questions.length} randomized questions. Do not switch tabs or block your webcam.
            </p>
          </div>
          <div className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-3.5 py-2 rounded-lg tabular-nums">
            Answered: {answeredCount} / {questions.length}
          </div>
        </div>

        {questions.map((q, idx) => (
          <article
            key={q.id}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
              <span className="font-medium text-[#1D4ED8]">
                Question {idx + 1} · {q.subject}
              </span>
              <span className="font-mono text-xs tabular-nums">
                {answers[q.id] !== undefined ? 'Recorded' : 'Unanswered'}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
              {q.prompt}
            </h2>

            <div className="space-y-2.5">
              {q.options.map((opt, optIdx) => {
                const selected = answers[q.id] === optIdx;
                return (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-3 p-3.5 rounded-lg border text-[15px] cursor-pointer transition-colors ${
                      selected
                        ? 'bg-blue-50/70 border-[#1D4ED8] text-slate-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      className="w-4 h-4 accent-[#1D4ED8]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </article>
        ))}

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            Answered <span className="font-mono font-semibold text-slate-900">{answeredCount}</span> of{' '}
            <span className="font-mono font-semibold text-slate-900">{questions.length}</span> questions.
            {trustScore < MIN_TRUST_REQUIRED && (
              <span className="block mt-1 font-medium text-red-700">
                Warning: Current trust score ({trustScore}) is below the {MIN_TRUST_REQUIRED} threshold.
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinishAssessment}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-[#1D4ED8] rounded-lg hover:bg-[#1E40AF] disabled:opacity-60 transition-colors cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>{isSubmitting ? 'Submitting Assessment...' : 'Submit Assessment & Unlock Result'}</span>
          </button>
        </div>
      </div>

      <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#1D4ED8]" aria-hidden="true" />
              <span>Webcam Proctoring</span>
            </h2>
            <span
              className={`text-xs font-semibold ${
                cameraStatus === 'active' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {cameraStatus === 'active'
                ? 'Camera Active'
                : cameraStatus === 'blocked'
                ? 'Camera Blocked'
                : 'No Hardware Feed'}
            </span>
          </div>

          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStatus === 'active' ? 'block' : 'hidden'}`}
            />
            {cameraStatus !== 'active' && (
              <div className="p-4 text-center text-slate-300 space-y-2">
                <CameraOff className="w-7 h-7 mx-auto text-slate-400" aria-hidden="true" />
                <p className="text-sm font-medium text-white">
                  {cameraStatus === 'blocked' ? 'Camera Feed Blocked' : 'Camera Device Unavailable'}
                </p>
                <p className="text-xs text-slate-400">{cameraNotice}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleCameraBlock}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
              cameraStatus === 'active'
                ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                : 'text-slate-700 bg-slate-50 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {cameraStatus === 'active' ? (
              <>
                <CameraOff className="w-4 h-4" aria-hidden="true" />
                <span>Block Camera (-20 Trust Pts)</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>Enable / Retry Webcam</span>
              </>
            )}
          </button>
        </div>

        <div className={`border rounded-xl p-5 space-y-3 ${trustTone.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${trustTone.text}`} aria-hidden="true" />
              <span>Trust Score</span>
            </span>
            <span className={`font-mono text-2xl font-bold tabular-nums ${trustTone.text}`}>
              {trustScore} / 100
            </span>
          </div>
          <p className={`text-sm font-medium ${trustTone.text}`}>
            {trustTone.label} (Min Required: {MIN_TRUST_REQUIRED})
          </p>
          <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all ${
                trustScore >= 80
                  ? 'bg-emerald-600'
                  : trustScore >= MIN_TRUST_REQUIRED
                  ? 'bg-amber-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Proctoring Event Log</h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {violations.length} alert(s)
            </span>
          </div>
          {violations.length === 0 ? (
            <p className="text-sm text-slate-500">
              No integrity alerts recorded. Keep this tab active and camera unobstructed.
            </p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {violations.map((v) => (
                <li
                  key={v.id}
                  className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-semibold">
                      -{v.pointsDeducted} pts · {v.timestamp}
                    </div>
                    <div className="text-red-800">{v.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </section>
  );
}
