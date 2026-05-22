class MockDatabase {
  static _instance = null;

  constructor() {
    if (MockDatabase._instance) {
      return MockDatabase._instance;
    }

    this.data = {
      users: [
        {
          id: 'U001',
          username: 'teacher',
          password: 'password',
          role: 'teacher',
          name: 'Bob',
        },
        {
          id: 'U002',
          username: 'student',
          password: 'password',
          role: 'student',
          name: 'John',
        },
      ],

      exams: [
        {
          id: 'EX001',
          title: 'JavaScript Basics',
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

    MockDatabase._instance = this;
  }

  // --- User helpers ---

  findUser(username) {
    return (
      this.data.users.find(
        u => u.username.toLowerCase() === username.toLowerCase()
      ) ?? null
    );
  }

  addUser(user) {
    this.data.users.push(user);
    return user;
  }

  // --- Exam helpers ---

  findExam(id) {
    return this.data.exams.find(e => e.id === id) ?? null;
  }

  addExam(exam) {
    this.data.exams.push(exam);
    return exam;
  }

  deleteExam(id) {
    this.data.exams = this.data.exams.filter(e => e.id !== id);
  }

  updateExam(id, updated) {
    const index = this.data.exams.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.data.exams[index] = { ...this.data.exams[index], ...updated };
    return this.data.exams[index];
  }

  // --- Submission helpers ---

  addSubmission(submission) {
    this.data.submissions.push(submission);
    return submission;
  }

  getSubmissions() {
    return [...this.data.submissions];
  }

  getSubmissionById(id) {
    return this.data.submissions.find(s => s.id === id) ?? null;
  }

  updateSubmission(id, updates) {
    const index = this.data.submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.data.submissions[index] = { ...this.data.submissions[index], ...updates };
    return this.data.submissions[index];
  }
}

export const mockDb = new MockDatabase();
