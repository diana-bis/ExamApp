import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// ─── In-Memory Database ────────────────────────────────────────────────────
// Same structure and seed data as client/src/api/mockDb.js.
// Data resets every time the server restarts.

const db = {
  users: [
    { id: 'U001', username: 'teacher', password: 'password', role: 'teacher', name: 'Bob' },
    { id: 'U002', username: 'student', password: 'password', role: 'student', name: 'John' },
  ],

  exams: [
    {
      id: 'EX001',
      title: 'JavaScript Basics',
      status: 'published',
      timeLimit: 60,
      passingGrade: 60,
      questions: [
        {
          id: 'q1',
          type: 'MULTIPLE_CHOICE',
          text: 'What is typeof null?',
          options: ['object', 'null', 'undefined', 'number'],
          correctAnswer: 'object',
        },
        {
          id: 'q2',
          type: 'MULTIPLE_CHOICE',
          text: 'Which keyword declares a block-scoped variable?',
          options: ['var', 'let', 'function', 'class'],
          correctAnswer: 'let',
        },
      ],
    },
    {
      id: 'EX002',
      title: 'React Fundamentals',
      status: 'published',
      timeLimit: 45,
      passingGrade: 70,
      questions: [
        {
          id: 'q1',
          type: 'MULTIPLE_CHOICE',
          text: 'Which hook manages local state in a React component?',
          options: ['useEffect', 'useRef', 'useState', 'useContext'],
          correctAnswer: 'useState',
        },
        {
          id: 'q2',
          type: 'MULTIPLE_CHOICE',
          text: 'What does useEffect with an empty dependency array do?',
          options: [
            'Runs on every render',
            'Runs once on mount',
            'Runs on unmount only',
            'Never runs',
          ],
          correctAnswer: 'Runs once on mount',
        },
        {
          id: 'q3',
          type: 'OPEN_ENDED',
          text: 'Describe the virtual DOM and explain why React uses it.',
        },
      ],
    },
  ],

  submissions: [],
};

// ─── Middleware ────────────────────────────────────────────────────────────

// Allow requests from the Vite dev server
app.use(cors({ origin: 'http://localhost:5173' }));

// Parse JSON request bodies
app.use(express.json());

// Request logger — prints method, path, status, and duration for every request
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[SERVER] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─── Auth Routes ──────────────────────────────────────────────────────────

// POST /api/auth/login
// Body: { username, password }
// Returns: user object (no password) + mock token, or 401
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user) {
    return res.status(401).json({ error: 'Username not found', field: 'username' });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password', field: 'password' });
  }
  const { password: _pw, ...safeUser } = user;
  return res.json({ ...safeUser, token: 'mock-token' });
});

// POST /api/auth/register
// Body: { name, username, password, role }
// Returns: newly created user (no password), or 409 if username taken
app.post('/api/auth/register', (req, res) => {
  const { name, username, password, role } = req.body;
  const exists = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: 'Username is already taken', field: 'username' });
  }
  const newUser = {
    id: `U${Date.now()}`,
    username: username.trim(),
    password,
    role,
    name: name.trim(),
  };
  db.users.push(newUser);
  const { password: _pw, ...safeUser } = newUser;
  return res.status(201).json(safeUser);
});

// GET /api/users
// Returns: all users without passwords
app.get('/api/users', (req, res) => {
  res.json(db.users.map(({ password, ...u }) => u));
});

// ─── Exam Routes ──────────────────────────────────────────────────────────

// GET /api/exams
// Returns: all exams
app.get('/api/exams', (req, res) => {
  res.json(db.exams);
});

// GET /api/exams/:id
// Returns: one exam, or 404
app.get('/api/exams/:id', (req, res) => {
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  res.json(exam);
});

// POST /api/exams
// Body: exam data (title, questions, etc.)
// Returns: newly created exam with auto-generated EX### id
app.post('/api/exams', (req, res) => {
  const maxNum = db.exams
    .map((e) => parseInt(e.id.replace('EX', ''), 10))
    .filter((n) => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  const newExam = {
    id: `EX${String(maxNum + 1).padStart(3, '0')}`,
    status: 'draft',
    ...req.body,
  };
  db.exams.push(newExam);
  res.status(201).json(newExam);
});

// PUT /api/exams/:id
// Body: fields to update (merged with existing exam)
// Returns: updated exam, or 404
app.put('/api/exams/:id', (req, res) => {
  const index = db.exams.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Exam not found' });
  db.exams[index] = { ...db.exams[index], ...req.body };
  res.json(db.exams[index]);
});

// DELETE /api/exams/:id
// Returns: 204 No Content, or 404
app.delete('/api/exams/:id', (req, res) => {
  const exists = db.exams.some((e) => e.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Exam not found' });
  db.exams = db.exams.filter((e) => e.id !== req.params.id);
  res.status(204).send();
});

// ─── Submission Routes ────────────────────────────────────────────────────

// GET /api/submissions
// Optional query params: ?examId=EX001  or  ?studentId=U002
// Returns: filtered or all submissions
app.get('/api/submissions', (req, res) => {
  const { examId, studentId } = req.query;
  let results = db.submissions;
  if (examId) results = results.filter((s) => s.examId === examId);
  if (studentId) results = results.filter((s) => s.studentId === studentId);
  res.json(results);
});

// POST /api/submissions
// Body: { studentId, examId, answers, grade, resultsPublished? }
// Returns: newly created submission with auto-generated SUB id + submittedAt timestamp
app.post('/api/submissions', (req, res) => {
  const record = {
    id: `SUB${Date.now()}`,
    ...req.body,
    resultsPublished: req.body.resultsPublished ?? true,
    submittedAt: new Date().toISOString(),
  };
  db.submissions.push(record);
  res.status(201).json(record);
});

// GET /api/submissions/:id
// Returns: one submission, or 404
app.get('/api/submissions/:id', (req, res) => {
  const sub = db.submissions.find((s) => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  res.json(sub);
});

// PUT /api/submissions/:id
// Body: fields to update (used by teacher when grading)
// Returns: updated submission, or 404
app.put('/api/submissions/:id', (req, res) => {
  const index = db.submissions.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Submission not found' });
  db.submissions[index] = { ...db.submissions[index], ...req.body };
  res.json(db.submissions[index]);
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[SERVER] ExamApp API running on http://localhost:${PORT}`);
  console.log(`[SERVER] Mode: in-memory | CORS origin: http://localhost:5173`);
  console.log(`[SERVER] Routes: /api/auth  /api/exams  /api/submissions`);
});
