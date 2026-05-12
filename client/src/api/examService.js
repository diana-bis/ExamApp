import { mockDb } from './mockDb';

// Function that returns all exams - simulates a backend API request
export const getAllExams = () => {
  // Simulate network delay with setTimeout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockDb.exams]);
    }, 800);
  });
};

// Function to fetch one exam by its ID
export const getExamById = (id) => {
  // Simulate network delay and potential error handling
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exam = mockDb.exams.find(e => e.id === id);
      if (exam) {
        resolve({ ...exam });
      } else {
        reject(new Error("Exam not found"));
      }
    }, 500);
  });
};

// Function to create a new exam 
export const createExam = (exam) => {
  // Simulated backend processing delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExam = { ...exam, id: `EX${Math.floor(Math.random() * 1000)}` };
      mockDb.exams.push(newExam);
      resolve(newExam);
    }, 1000);
  });
};
