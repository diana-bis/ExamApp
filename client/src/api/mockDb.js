// Mock database for exams and student scores
export const mockDb = {

  // Array of all exams in the system
  exams: [
    {
      id: "EX001",
      title: "JavaScript Basics",
      questions: [
        { id: 1, question: "What is closure?", options: ["A", "B", "C", "D"], answer: "A" },
        { id: 2, question: "What is hoisting?", options: ["A", "B", "C", "D"], answer: "B" }
      ]
    },
    {
      id: "EX002",
      title: "React Fundamentals",
      questions: [
        { id: 1, question: "What is a hook?", options: ["A", "B", "C", "D"], answer: "C" }
      ]
    }
  ],
  // Array of student scores for exams
  studentScores: [
    { studentName: "Alice", examId: "EX001", score: 85 },
    { studentName: "Bob", examId: "EX001", score: 70 }
  ]
};
