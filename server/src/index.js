import express from 'express';
import cors from 'cors';
import pool from './db/connect.js';

const app = express();
const PORT = 3001;

// ─── Middleware ────────────────────────────────────────────────────────────

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[SERVER] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─── Auth Routes ──────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Username not found', field: 'username' });
  if (user.password !== password) return res.status(401).json({ error: 'Incorrect password', field: 'password' });
  const { password: _pw, ...safeUser } = user;
  return res.json({ ...safeUser, token: 'mock-token' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, username, password, role } = req.body;
  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  if (existing.length > 0) return res.status(409).json({ error: 'Username is already taken', field: 'username' });

  const id = `U${Date.now()}`;
  const { rows } = await pool.query(
    'INSERT INTO users (id, username, password, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, name',
    [id, username.trim(), password, role, name.trim()]
  );
  return res.status(201).json(rows[0]);
});

app.get('/api/users', async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, role, name FROM users');
  res.json(rows);
});

// ─── Exam Routes ──────────────────────────────────────────────────────────

function rowToExam(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    timeLimit: row.time_limit,
    passingGrade: row.passing_grade,
    questions: row.questions,
    deadline: row.deadline ?? undefined,
  };
}

app.get('/api/exams', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM exams');
  res.json(rows.map(rowToExam));
});

app.get('/api/exams/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
  res.json(rowToExam(rows[0]));
});

app.post('/api/exams', async (req, res) => {
  const { rows: all } = await pool.query("SELECT id FROM exams WHERE id LIKE 'EX%'");
  const maxNum = all
    .map((r) => parseInt(r.id.replace('EX', ''), 10))
    .filter((n) => !isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  const id = `EX${String(maxNum + 1).padStart(3, '0')}`;

  const { title, status = 'draft', timeLimit, passingGrade, questions = [], deadline } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO exams (id, title, status, time_limit, passing_grade, questions, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, title, status, timeLimit ?? null, passingGrade ?? null, JSON.stringify(questions), deadline ?? null]
  );
  res.status(201).json(rowToExam(rows[0]));
});

app.put('/api/exams/:id', async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Exam not found' });

  const current = existing[0];
  const { title, status, timeLimit, passingGrade, questions, deadline } = req.body;
  const { rows } = await pool.query(
    `UPDATE exams SET
       title         = $1,
       status        = $2,
       time_limit    = $3,
       passing_grade = $4,
       questions     = $5,
       deadline      = $6
     WHERE id = $7 RETURNING *`,
    [
      title         ?? current.title,
      status        ?? current.status,
      timeLimit     !== undefined ? timeLimit     : current.time_limit,
      passingGrade  !== undefined ? passingGrade  : current.passing_grade,
      JSON.stringify(questions !== undefined ? questions : current.questions),
      deadline      !== undefined ? deadline      : current.deadline,
      req.params.id,
    ]
  );
  res.json(rowToExam(rows[0]));
});

app.delete('/api/exams/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Exam not found' });
  res.status(204).send();
});

// ─── Submission Routes ────────────────────────────────────────────────────

function rowToSubmission(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    examId: row.exam_id,
    answers: row.answers,
    grade: row.grade,
    feedback: row.feedback ?? null,
    resultsPublished: row.results_published,
    submittedAt: row.submitted_at,
  };
}

app.get('/api/submissions', async (req, res) => {
  const { examId, studentId } = req.query;
  let query = 'SELECT * FROM submissions WHERE TRUE';
  const params = [];
  if (examId)    { params.push(examId);    query += ` AND exam_id = $${params.length}`; }
  if (studentId) { params.push(studentId); query += ` AND student_id = $${params.length}`; }
  const { rows } = await pool.query(query, params);
  res.json(rows.map(rowToSubmission));
});

app.post('/api/submissions', async (req, res) => {
  const { studentId, examId, answers, grade, resultsPublished = true } = req.body;
  const id = `SUB${Date.now()}`;
  const { rows } = await pool.query(
    `INSERT INTO submissions (id, student_id, exam_id, answers, grade, results_published)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, studentId, examId, JSON.stringify(answers), grade ?? null, resultsPublished]
  );
  res.status(201).json(rowToSubmission(rows[0]));
});

app.get('/api/submissions/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM submissions WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
  res.json(rowToSubmission(rows[0]));
});

app.put('/api/submissions/:id', async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM submissions WHERE id = $1', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Submission not found' });

  const current = existing[0];
  const { grade, resultsPublished, answers, feedback } = req.body;
  const { rows } = await pool.query(
    `UPDATE submissions SET
       grade             = $1,
       results_published = $2,
       answers           = $3,
       feedback          = $4
     WHERE id = $5 RETURNING *`,
    [
      grade             !== undefined ? grade             : current.grade,
      resultsPublished  !== undefined ? resultsPublished  : current.results_published,
      JSON.stringify(answers !== undefined ? answers : current.answers),
      feedback          !== undefined ? feedback          : current.feedback,
      req.params.id,
    ]
  );
  res.json(rowToSubmission(rows[0]));
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[SERVER] ExamApp API running on http://localhost:${PORT}`);
  console.log(`[SERVER] Mode: PostgreSQL | CORS origin: http://localhost:5173`);
  console.log(`[SERVER] Routes: /api/auth  /api/exams  /api/submissions`);
});
