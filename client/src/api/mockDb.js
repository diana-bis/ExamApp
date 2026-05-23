/*
 * MockDatabase
 *
 * In-memory fake database used while no real backend exists.
 * Simulates backend/database behavior for development.
 *
 * Stores:
 *   - users
 *   - exams
 *   - submissions
 *
 * Singleton pattern:
 *   Only ONE shared database instance exists across the app.
 */

class MockDatabase {
  // static property to hold the singleton instance
  static _instance = null;

  constructor() {
    // if an instance already exists, return it to enforce singleton pattern
    if (MockDatabase._instance) {
      return MockDatabase._instance;
    }

    // initialize data with some default users and exams
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
          // exam 1 with only multiple choice questions
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
          // exam 2 with multiple choice and open-ended questions
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

      // exam submissions made by students
      submissions: [],
    };

    // save singleton instance
    MockDatabase._instance = this;
  }

  // --- User helpers ---

  // find user by username (used for login)
  findUser(username) {
    return (
      this.data.users.find(
        u => u.username.toLowerCase() === username.toLowerCase()
      ) ?? null
    );
  }

  // add new user (used for registration)
  addUser(user) {
    this.data.users.push(user);
    return user;
  }

  // --- Exam helpers ---

  // find exam by id (used for exam details, student taking exam, and teacher editing exam)
  findExam(id) {
    return this.data.exams.find(e => e.id === id) ?? null;
  }

  // add new exam (used by teacher when creating an exam)
  addExam(exam) {
    this.data.exams.push(exam);
    return exam;
  }

  // delete exam by id (used by teacher when deleting an exam)
  deleteExam(id) {
    this.data.exams = this.data.exams.filter(e => e.id !== id);
  }

  // update exam by id with new data (used by teacher when editing an exam)
  updateExam(id, updated) {
    const index = this.data.exams.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.data.exams[index] = { ...this.data.exams[index], ...updated };
    return this.data.exams[index];
  }

  // --- Submission helpers ---

  // add new submission (used when student submits an exam)
  addSubmission(submission) {
    this.data.submissions.push(submission);
    return submission;
  }

  // get all submissions (used by teacher to view all submissions for an exam)
  getSubmissions() {
    return [...this.data.submissions];
  }

  // get one submission by id (used when student views their submission details)
  getSubmissionById(id) {
    return this.data.submissions.find(s => s.id === id) ?? null;
  }

  // update submission by id with new data (used when teacher grades a submission)
  updateSubmission(id, updates) {
    const index = this.data.submissions.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.data.submissions[index] = { ...this.data.submissions[index], ...updates };
    return this.data.submissions[index];
  }
}

// export a singleton instance of the MockDatabase class
export const mockDb = new MockDatabase();
