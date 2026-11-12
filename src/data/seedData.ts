import type { QuestionItem, StudentProfile, SubjectName, VisitingCompany } from '../types/placement';

export const ROLE_PASSCODES = {
  student: 'STUDENT2026',
  recruiter: 'RECRUIT2026',
  placement: 'PLACEMENT2026',
} as const;

export const MIN_TRUST_REQUIRED = 60;

export const SUBJECT_LIST: SubjectName[] = [
  'Data Structures',
  'System Design',
  'Databases & SQL',
  'Web & APIs',
  'Aptitude & Logic',
];

export const BRANCH_OPTIONS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Data Science & AI',
];

/**
 * Generates a valid, standards-compliant minimal PDF data URL containing the
 * candidate's structured resume summary so Recruiters can preview & download
 * real PDFs even for pre-seeded students.
 */
export function buildSampleResumePdfDataUrl(lines: string[]): string {
  const safeLines = lines.map((l) =>
    l.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').slice(0, 88)
  );
  const textOps = safeLines
    .map((line, i) => `BT /F1 ${i === 0 ? 15 : 10} Tf 50 ${750 - i * 20} Td (${line}) Tj ET`)
    .join('\n');
  const stream = `${textOps}\n`;

  const obj1 = '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n';
  const obj2 = '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n';
  const obj3 =
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n';
  const obj4 = `4 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj\n`;
  const obj5 =
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n';

  const header = '%PDF-1.4\n';
  const body = obj1 + obj2 + obj3 + obj4 + obj5;
  const pdfString = `${header}${body}trailer << /Root 1 0 R >>\n%%EOF`;
  const bytes = new TextEncoder().encode(pdfString);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

export const VISITING_COMPANIES: VisitingCompany[] = [
  {
    id: 'comp-stripe',
    name: 'Stripe',
    roleTitle: 'Software Engineer — Payments Infrastructure',
    ctcPackage: '$142,000 / yr',
    location: 'San Francisco / Hybrid',
    visitDate: 'Nov 24, 2026',
    minCgpa: 8.2,
    allowedBranches: ['Computer Science', 'Information Technology', 'Data Science & AI'],
    maxBacklogs: 0,
    requiredSkills: ['TypeScript', 'Distributed Systems', 'SQL'],
    minAssessmentPct: 75,
    minTrustScore: 80,
    highlights: 'Requires strong API reliability fundamentals and zero active backlogs.',
  },
  {
    id: 'comp-atlassian',
    name: 'Atlassian',
    roleTitle: 'Associate Product Engineer',
    ctcPackage: '$128,000 / yr',
    location: 'Remote / Bengaluru',
    visitDate: 'Nov 27, 2026',
    minCgpa: 7.5,
    allowedBranches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Data Science & AI'],
    maxBacklogs: 0,
    requiredSkills: ['React', 'JavaScript', 'REST APIs'],
    minAssessmentPct: 68,
    minTrustScore: 70,
    highlights: 'Full-stack product engineering track with collaborative architecture round.',
  },
  {
    id: 'comp-datadog',
    name: 'Datadog',
    roleTitle: 'Systems & Telemetry Engineer',
    ctcPackage: '$136,000 / yr',
    location: 'New York / Hybrid',
    visitDate: 'Dec 02, 2026',
    minCgpa: 8.0,
    allowedBranches: ['Computer Science', 'Information Technology', 'Data Science & AI'],
    maxBacklogs: 0,
    requiredSkills: ['Go', 'Databases', 'System Design'],
    minAssessmentPct: 72,
    minTrustScore: 75,
    highlights: 'Focuses on time-series ingestion pipelines and high-concurrency debugging.',
  },
  {
    id: 'comp-adobe',
    name: 'Adobe',
    roleTitle: 'Frontend & Creative Cloud Engineer',
    ctcPackage: '$122,000 / yr',
    location: 'San Jose / Noida',
    visitDate: 'Dec 05, 2026',
    minCgpa: 7.2,
    allowedBranches: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
    maxBacklogs: 1,
    requiredSkills: ['React', 'TypeScript', 'CSS'],
    minAssessmentPct: 62,
    minTrustScore: 65,
    highlights: 'Evaluates browser rendering performance and accessible UI architecture.',
  },
  {
    id: 'comp-qualcomm',
    name: 'Qualcomm',
    roleTitle: 'Embedded & Edge Systems Engineer',
    ctcPackage: '$118,000 / yr',
    location: 'San Diego / Hyderabad',
    visitDate: 'Dec 09, 2026',
    minCgpa: 7.4,
    allowedBranches: ['Electronics & Communication', 'Electrical Engineering', 'Computer Science'],
    maxBacklogs: 0,
    requiredSkills: ['C++', 'Embedded Systems', 'Linux'],
    minAssessmentPct: 65,
    minTrustScore: 70,
    highlights: 'Low-level memory optimization, RTOS scheduling, and hardware telemetry.',
  },
  {
    id: 'comp-razorpay',
    name: 'Razorpay',
    roleTitle: 'Backend SDE I — Core Ledger',
    ctcPackage: '$110,000 / yr',
    location: 'Bengaluru',
    visitDate: 'Dec 12, 2026',
    minCgpa: 7.0,
    allowedBranches: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Data Science & AI'],
    maxBacklogs: 1,
    requiredSkills: ['Node.js', 'SQL', 'REST APIs'],
    minAssessmentPct: 58,
    minTrustScore: 60,
    highlights: 'Idempotent transaction processing and relational database indexing.',
  },
];

export const QUESTION_POOL: QuestionItem[] = [
  // Data Structures (5)
  {
    id: 'ds-1',
    subject: 'Data Structures',
    prompt: 'What is the worst-case time complexity of searching for an element in a balanced AVL tree with N nodes?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctIndex: 1,
    explanation: 'AVL trees maintain height balance at O(log N), bounding search operations to O(log N).',
  },
  {
    id: 'ds-2',
    subject: 'Data Structures',
    prompt: 'Which data structure gives O(1) average lookup and O(1) eviction when combined with a doubly linked list for an LRU Cache?',
    options: ['Min-Heap', 'Hash Map', 'Trie', 'Disjoint Set'],
    correctIndex: 1,
    explanation: 'A Hash Map maps keys directly to doubly linked list nodes for O(1) lookup and O(1) reordering.',
  },
  {
    id: 'ds-3',
    subject: 'Data Structures',
    prompt: 'In Dijkstra’s shortest path algorithm with a binary min-heap on V vertices and E edges, what is the runtime complexity?',
    options: ['O(V^2)', 'O((V + E) log V)', 'O(V * E)', 'O(E log E^2)'],
    correctIndex: 1,
    explanation: 'Each vertex extraction and edge relaxation takes O(log V) with a binary heap.',
  },
  {
    id: 'ds-4',
    subject: 'Data Structures',
    prompt: 'Which traversal of a Binary Search Tree outputs keys in strictly non-decreasing sorted order?',
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correctIndex: 1,
    explanation: 'In-order traversal visits left subtree, current node, then right subtree.',
  },
  {
    id: 'ds-5',
    subject: 'Data Structures',
    prompt: 'What is the amortized time complexity of pushing an element onto a dynamically resizing array that doubles capacity?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
    correctIndex: 0,
    explanation: 'Doubling capacity spreads occasional O(N) copy costs across N insertions for O(1) amortized push.',
  },

  // System Design (5)
  {
    id: 'sys-1',
    subject: 'System Design',
    prompt: 'Which mechanism protects a downstream microservice from cascading failures when its latency spikes?',
    options: ['Consistent Hashing', 'Circuit Breaker', 'Write-Ahead Log', 'Bloom Filter'],
    correctIndex: 1,
    explanation: 'A circuit breaker trips open when failure thresholds are reached, failing fast to let the service recover.',
  },
  {
    id: 'sys-2',
    subject: 'System Design',
    prompt: 'Why is Consistent Hashing preferred over modulo-N hashing for distributed cache partitions?',
    options: [
      'It encrypts cache keys automatically',
      'It minimizes key remapping when nodes join or leave',
      'It eliminates network latency completely',
      'It removes the need for replication',
    ],
    correctIndex: 1,
    explanation: 'Consistent hashing only moves ~K/N keys on node changes instead of reshuffling nearly all keys.',
  },
  {
    id: 'sys-3',
    subject: 'System Design',
    prompt: 'Which rate-limiting algorithm allows short bursts of traffic while enforcing a steady average request rate?',
    options: ['Token Bucket', 'Two-Phase Commit', 'Round Robin', 'Binary Exponential Backoff'],
    correctIndex: 0,
    explanation: 'Token Bucket accumulates tokens up to burst capacity while refilling at the steady target rate.',
  },
  {
    id: 'sys-4',
    subject: 'System Design',
    prompt: 'In an event-driven architecture, what does an Idempotency Key guarantee on a payment endpoint?',
    options: [
      'Requests are compressed with gzip',
      'Retried identical requests do not execute duplicate charges',
      'Database locks are never acquired',
      'Payloads skip schema validation',
    ],
    correctIndex: 1,
    explanation: 'Idempotency keys let servers recognize retries and return the original outcome safely.',
  },
  {
    id: 'sys-5',
    subject: 'System Design',
    prompt: 'According to the CAP theorem, during a network partition a distributed data store must choose between:',
    options: [
      'Caching and Indexing',
      'Consistency and Availability',
      'Throughput and Compression',
      'Encryption and Sharding',
    ],
    correctIndex: 1,
    explanation: 'When a partition occurs (P), nodes must either reject writes/reads to stay consistent (C) or stay available (A).',
  },

  // Databases & SQL (5)
  {
    id: 'db-1',
    subject: 'Databases & SQL',
    prompt: 'Which PostgreSQL index type is best suited for fast equality and range queries (`WHERE score >= 80`)?',
    options: ['B-Tree Index', 'GIN Index', 'Hash Index', 'BRIN Only'],
    correctIndex: 0,
    explanation: 'B-Tree indexes keep keys sorted and support both equality (=) and range (<, >=, BETWEEN) predicates.',
  },
  {
    id: 'db-2',
    subject: 'Databases & SQL',
    prompt: 'What problem does Database Normalization to 3NF primarily eliminate?',
    options: [
      'Slow TLS handshakes',
      'Update, insert, and delete anomalies from redundant dependencies',
      'Integer overflow in primary keys',
      'Full-table locks during SELECT',
    ],
    correctIndex: 1,
    explanation: 'Third Normal Form removes transitive dependencies so facts are stored in a single authoritative place.',
  },
  {
    id: 'db-3',
    subject: 'Databases & SQL',
    prompt: 'Which SQL clause filters groups after aggregation (COUNT, AVG) has been computed?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
    correctIndex: 1,
    explanation: 'WHERE filters rows prior to grouping, whereas HAVING filters aggregated groups.',
  },
  {
    id: 'db-4',
    subject: 'Databases & SQL',
    prompt: 'What does the "I" in ACID database transactions guarantee?',
    options: [
      'Indexed Queries',
      'Isolation between concurrent transactions',
      'Immutable Schemas',
      'Instant Replication',
    ],
    correctIndex: 1,
    explanation: 'Isolation ensures concurrent transactions do not observe inconsistent intermediate states of one another.',
  },
  {
    id: 'db-5',
    subject: 'Databases & SQL',
    prompt: 'When an ORM executes 1 query for 50 orders and then 50 separate queries for each order’s customer, this is called:',
    options: ['Phantom Read', 'N+1 Query Problem', 'Cartesian Explosion', 'Deadlock'],
    correctIndex: 1,
    explanation: 'N+1 occurs when fetching a list triggers one query per row instead of a batched JOIN or IN query.',
  },

  // Web & APIs (5)
  {
    id: 'web-1',
    subject: 'Web & APIs',
    prompt: 'Which HTTP status code is most appropriate when a client submits invalid input fields that fail validation?',
    options: ['201 Created', '400 Bad Request', '401 Unauthorized', '502 Bad Gateway'],
    correctIndex: 1,
    explanation: '400 Bad Request indicates malformed or invalid client request parameters.',
  },
  {
    id: 'web-2',
    subject: 'Web & APIs',
    prompt: 'Which cookie attribute prevents client-side JavaScript (document.cookie) from reading an authentication token?',
    options: ['SameSite=Lax', 'HttpOnly', 'Max-Age', 'Domain'],
    correctIndex: 1,
    explanation: 'HttpOnly blocks script access to the cookie, mitigating XSS token theft.',
  },
  {
    id: 'web-3',
    subject: 'Web & APIs',
    prompt: 'What triggers a CORS preflight OPTIONS request in a browser?',
    options: [
      'Any same-origin GET request',
      'Cross-origin requests with custom headers like Authorization or JSON Content-Type',
      'Loading an inline SVG',
      'Submitting a standard HTML form',
    ],
    correctIndex: 1,
    explanation: 'Non-simple cross-origin requests require the browser to verify server permissions via OPTIONS first.',
  },
  {
    id: 'web-4',
    subject: 'Web & APIs',
    prompt: 'In React, why should list items use stable unique IDs for key props instead of array indices when items reorder?',
    options: [
      'Array indices cause TypeScript compilation errors',
      'Stable keys prevent mismatched component state and unnecessary DOM re-mounts',
      'Keys automatically persist state to localStorage',
      'Browser CSS ignores elements keyed by number',
    ],
    correctIndex: 1,
    explanation: 'React tracks element identity across renders using key; index keys break state mapping on reorder/delete.',
  },
  {
    id: 'web-5',
    subject: 'Web & APIs',
    prompt: 'Which HTTP method is strictly idempotent according to RFC specifications?',
    options: ['POST', 'PUT', 'CONNECT', 'PATCH'],
    correctIndex: 1,
    explanation: 'Repeating an identical PUT replaces the target resource with the same state, making it idempotent.',
  },

  // Aptitude & Logic (5)
  {
    id: 'apt-1',
    subject: 'Aptitude & Logic',
    prompt: 'A server handles 1,200 requests per minute. After a 25% latency optimization, throughput rises by 20%. What is the new rate per minute?',
    options: ['1,380', '1,440', '1,500', '1,600'],
    correctIndex: 1,
    explanation: '1,200 * 1.20 = 1,440 requests per minute.',
  },
  {
    id: 'apt-2',
    subject: 'Aptitude & Logic',
    prompt: 'If 4 engineers complete a migration in 6 days, how many days will 8 engineers working at the same pace take?',
    options: ['2 days', '3 days', '4 days', '12 days'],
    correctIndex: 1,
    explanation: 'Total effort is 4 * 6 = 24 engineer-days; 24 / 8 = 3 days.',
  },
  {
    id: 'apt-3',
    subject: 'Aptitude & Logic',
    prompt: 'Find the next number in the sequence: 3, 7, 15, 31, 63, ...',
    options: ['95', '125', '127', '129'],
    correctIndex: 2,
    explanation: 'Each term follows 2n + 1: 63 * 2 + 1 = 127.',
  },
  {
    id: 'apt-4',
    subject: 'Aptitude & Logic',
    prompt: 'A bag contains 5 backend bugs and 3 frontend bugs. If one bug is picked at random, what is the probability it is a frontend bug?',
    options: ['3/5', '3/8', '5/8', '1/3'],
    correctIndex: 1,
    explanation: 'There are 3 favorable outcomes out of 5 + 3 = 8 total bugs.',
  },
  {
    id: 'apt-5',
    subject: 'Aptitude & Logic',
    prompt: 'Two microservices sync every 12 seconds and 18 seconds respectively. If they sync together at 10:00:00, when do they next sync together?',
    options: ['10:00:24', '10:00:30', '10:00:36', '10:01:00'],
    correctIndex: 2,
    explanation: 'LCM(12, 18) = 36 seconds, so 10:00:36.',
  },
];

export const SEEDED_STUDENTS: StudentProfile[] = [
  {
    id: 'stu-ananya',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@campus.edu',
    rollNumber: 'CS23B014',
    branch: 'Computer Science',
    graduationYear: 2027,
    cgpa: 9.15,
    activeBacklogs: 0,
    skills: ['TypeScript', 'React', 'Distributed Systems', 'SQL', 'Go'],
    portfolioUrl: 'https://github.com/ananya-sharma',
    resumeFileName: 'Ananya_Sharma_Resume.pdf',
    resumePdfDataUrl: buildSampleResumePdfDataUrl([
      'ANANYA SHARMA - B.Tech Computer Science (CGPA: 9.15 / 10)',
      'Email: ananya.sharma@campus.edu | Roll: CS23B014 | Grad: 2027',
      'Skills: TypeScript, React, Distributed Systems, PostgreSQL, Go, Docker',
      'Experience: Systems Engineering Intern - Built low-latency telemetry collectors',
      'Projects: Raft Consensus KV Store; Real-time Campus Shuttle ETA Pipeline',
    ]),
    createdAt: '2026-11-10T09:15:00.000Z',
    latestResult: {
      attemptId: 'att-ananya-1',
      completedAt: '2026-11-11T14:20:00.000Z',
      totalCorrect: 13,
      totalQuestions: 15,
      assessmentPct: 86.7,
      trustScore: 96,
      minTrustRequired: MIN_TRUST_REQUIRED,
      trustCleared: true,
      compositeRankScore: 89.03,
      subjectBreakdown: [
        { subject: 'Data Structures', correct: 3, total: 3, percentage: 100 },
        { subject: 'System Design', correct: 3, total: 3, percentage: 100 },
        { subject: 'Databases & SQL', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Web & APIs', correct: 3, total: 3, percentage: 100 },
        { subject: 'Aptitude & Logic', correct: 2, total: 3, percentage: 66.7 },
      ],
      weakAreas: [
        {
          subject: 'Databases & SQL',
          percentage: 66.7,
          recommendation: 'Practice composite indexing and N+1 query profiling.',
        },
        {
          subject: 'Aptitude & Logic',
          percentage: 66.7,
          recommendation: 'Drill timed quantitative rate and probability problems.',
        },
      ],
      violations: [],
    },
    attemptHistoryCount: 1,
    recommendedToCompanies: ['comp-stripe', 'comp-datadog'],
    placementNote: 'Top cohort performer in Distributed Systems with 96/100 trust verification.',
  },
  {
    id: 'stu-rohan',
    name: 'Rohan Verma',
    email: 'rohan.verma@campus.edu',
    rollNumber: 'IT23B042',
    branch: 'Information Technology',
    graduationYear: 2027,
    cgpa: 8.54,
    activeBacklogs: 0,
    skills: ['React', 'JavaScript', 'TypeScript', 'REST APIs', 'CSS', 'Node.js'],
    portfolioUrl: 'https://github.com/rohan-verma',
    resumeFileName: 'Rohan_Verma_Resume.pdf',
    resumePdfDataUrl: buildSampleResumePdfDataUrl([
      'ROHAN VERMA - B.Tech Information Technology (CGPA: 8.54 / 10)',
      'Email: rohan.verma@campus.edu | Roll: IT23B042 | Grad: 2027',
      'Skills: React, TypeScript, JavaScript, REST APIs, Node.js, Tailwind CSS',
      'Experience: Frontend Intern - Reduced bundle overhead by 34% on analytics dashboard',
      'Projects: Collaborative Markdown Whiteboard; Accessible Form Builder SDK',
    ]),
    createdAt: '2026-11-10T10:30:00.000Z',
    latestResult: {
      attemptId: 'att-rohan-1',
      completedAt: '2026-11-11T15:10:00.000Z',
      totalCorrect: 12,
      totalQuestions: 15,
      assessmentPct: 80.0,
      trustScore: 90,
      minTrustRequired: MIN_TRUST_REQUIRED,
      trustCleared: true,
      compositeRankScore: 82.5,
      subjectBreakdown: [
        { subject: 'Data Structures', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'System Design', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Databases & SQL', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Web & APIs', correct: 3, total: 3, percentage: 100 },
        { subject: 'Aptitude & Logic', correct: 3, total: 3, percentage: 100 },
      ],
      weakAreas: [
        {
          subject: 'Data Structures',
          percentage: 66.7,
          recommendation: 'Review graph shortest-path algorithms and balanced tree bounds.',
        },
        {
          subject: 'System Design',
          percentage: 66.7,
          recommendation: 'Study circuit breakers and consistent hashing tradeoffs.',
        },
      ],
      violations: [],
    },
    attemptHistoryCount: 1,
    recommendedToCompanies: ['comp-atlassian'],
    placementNote: 'Strong Web & APIs proficiency; ideal fit for product engineering teams.',
  },
  {
    id: 'stu-meera',
    name: 'Meera Nair',
    email: 'meera.nair@campus.edu',
    rollNumber: 'EC23B009',
    branch: 'Electronics & Communication',
    graduationYear: 2027,
    cgpa: 8.38,
    activeBacklogs: 0,
    skills: ['C++', 'Embedded Systems', 'Linux', 'Python', 'REST APIs'],
    portfolioUrl: 'https://github.com/meera-nair',
    resumeFileName: 'Meera_Nair_Resume.pdf',
    resumePdfDataUrl: buildSampleResumePdfDataUrl([
      'MEERA NAIR - B.Tech Electronics & Communication (CGPA: 8.38 / 10)',
      'Email: meera.nair@campus.edu | Roll: EC23B009 | Grad: 2027',
      'Skills: C++, Embedded Systems, Embedded Linux, RTOS, Python, Modbus Telemetry',
      'Experience: Embedded Firmware Intern - Implemented CAN-bus diagnostics logger',
      'Projects: Low-Power Edge Sensor Node; Automated Oscilloscope Trigger Utility',
    ]),
    createdAt: '2026-11-10T11:45:00.000Z',
    latestResult: {
      attemptId: 'att-meera-1',
      completedAt: '2026-11-11T16:05:00.000Z',
      totalCorrect: 11,
      totalQuestions: 15,
      assessmentPct: 73.3,
      trustScore: 95,
      minTrustRequired: MIN_TRUST_REQUIRED,
      trustCleared: true,
      compositeRankScore: 78.73,
      subjectBreakdown: [
        { subject: 'Data Structures', correct: 3, total: 3, percentage: 100 },
        { subject: 'System Design', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Databases & SQL', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Web & APIs', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Aptitude & Logic', correct: 2, total: 3, percentage: 66.7 },
      ],
      weakAreas: [
        {
          subject: 'Databases & SQL',
          percentage: 66.7,
          recommendation: 'Practice relational indexing and transaction isolation levels.',
        },
        {
          subject: 'Web & APIs',
          percentage: 66.7,
          recommendation: 'Review HTTP idempotency and CORS preflight mechanics.',
        },
      ],
      violations: [],
    },
    attemptHistoryCount: 1,
    recommendedToCompanies: ['comp-qualcomm'],
    placementNote: 'Consistent hardware/firmware background with spotless proctoring trust.',
  },
  {
    id: 'stu-kabir',
    name: 'Kabir Kulkarni',
    email: 'kabir.kulkarni@campus.edu',
    rollNumber: 'DS23B027',
    branch: 'Data Science & AI',
    graduationYear: 2027,
    cgpa: 7.82,
    activeBacklogs: 0,
    skills: ['SQL', 'Node.js', 'REST APIs', 'Python', 'Go', 'Databases'],
    portfolioUrl: 'https://github.com/kabir-kulkarni',
    resumeFileName: 'Kabir_Kulkarni_Resume.pdf',
    resumePdfDataUrl: buildSampleResumePdfDataUrl([
      'KABIR KULKARNI - B.Tech Data Science & AI (CGPA: 7.82 / 10)',
      'Email: kabir.kulkarni@campus.edu | Roll: DS23B027 | Grad: 2027',
      'Skills: PostgreSQL, Node.js, REST APIs, Go, Python, Time-Series Databases',
      'Experience: Backend Intern - Built idempotent webhook delivery queue',
      'Projects: Query Plan Analyzer CLI; Distributed Rate Limiter Middleware',
    ]),
    createdAt: '2026-11-10T13:10:00.000Z',
    latestResult: {
      attemptId: 'att-kabir-1',
      completedAt: '2026-11-11T17:30:00.000Z',
      totalCorrect: 10,
      totalQuestions: 15,
      assessmentPct: 66.7,
      trustScore: 85,
      minTrustRequired: MIN_TRUST_REQUIRED,
      trustCleared: true,
      compositeRankScore: 71.28,
      subjectBreakdown: [
        { subject: 'Data Structures', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'System Design', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Databases & SQL', correct: 3, total: 3, percentage: 100 },
        { subject: 'Web & APIs', correct: 2, total: 3, percentage: 66.7 },
        { subject: 'Aptitude & Logic', correct: 1, total: 3, percentage: 33.3 },
      ],
      weakAreas: [
        {
          subject: 'Aptitude & Logic',
          percentage: 33.3,
          recommendation: 'Focus on quantitative rate calculations and LCM word problems.',
        },
        {
          subject: 'Data Structures',
          percentage: 66.7,
          recommendation: 'Reinforce amortized analysis and graph traversal complexity.',
        },
      ],
      violations: [
        {
          id: 'viol-k1',
          type: 'tab-switch',
          timestamp: '2026-11-11T17:24:12.000Z',
          pointsDeducted: 15,
          detail: 'Browser tab switched away during Question 11.',
        },
      ],
    },
    attemptHistoryCount: 1,
    recommendedToCompanies: [],
    placementNote: '',
  },
];
