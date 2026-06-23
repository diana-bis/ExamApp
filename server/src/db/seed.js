import pool from './connect.js';

// ─── Schema ────────────────────────────────────────────────────────────────

const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL,
    name        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exams (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'draft',
    time_limit    INT,
    passing_grade INT,
    questions     JSONB NOT NULL DEFAULT '[]',
    deadline      TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id                 TEXT PRIMARY KEY,
    student_id         TEXT NOT NULL,
    exam_id            TEXT NOT NULL,
    answers            JSONB NOT NULL DEFAULT '{}',
    grade              INT,
    results_published  BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

// ─── Seed Data ─────────────────────────────────────────────────────────────

const SEED_USERS = [
  { id: 'U001', username: 'teacher', password: 'password', role: 'teacher', name: 'Bob' },
  { id: 'U002', username: 'student', password: 'password', role: 'student', name: 'John' },
];

const SEED_EXAMS = [
  {
    id: 'EX001',
    title: 'JavaScript Basics',
    status: 'published',
    time_limit: 60,
    passing_grade: 60,
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
    time_limit: 45,
    passing_grade: 70,
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
];

// ─── Runner ────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating tables...');
    await client.query(CREATE_TABLES);
    await client.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ`);

    console.log('Seeding users...');
    for (const u of SEED_USERS) {
      await client.query(
        `INSERT INTO users (id, username, password, role, name)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.username, u.password, u.role, u.name]
      );
    }

    console.log('Seeding exams...');
    for (const e of SEED_EXAMS) {
      await client.query(
        `INSERT INTO exams (id, title, status, time_limit, passing_grade, questions)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.title, e.status, e.time_limit, e.passing_grade, JSON.stringify(e.questions)]
      );
    }

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
