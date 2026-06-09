import pool from './connect.js';

const result = await pool.query('SELECT * FROM exams LIMIT 1');
const exam = result.rows[0];

console.log('─────────────────────────────────────');
console.log('  Exam ID    :', exam.id);
console.log('  Title      :', exam.title);
console.log('  Status     :', exam.status);
console.log('  Time Limit :', exam.time_limit, 'min');
console.log('  Passing    :', exam.passing_grade + '%');
console.log('─────────────────────────────────────');
console.log('  Questions  :', exam.questions.length);
exam.questions.forEach((q, i) => {
  console.log(`\n  [${i + 1}] ${q.text}`);
  console.log('       Type:', q.type);
  if (q.options) {
    q.options.forEach((opt, j) => console.log(`         ${j + 1}. ${opt}`));
  }
});
console.log('\n─────────────────────────────────────');

await pool.end();
