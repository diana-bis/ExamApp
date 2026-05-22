import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';

export class ExamService extends BaseApiService {
  async getAllExams() {
    await this.simulateDelay(800);
    return mockDb.data.exams.map(e => ({ ...e }));
  }

  async getExamById(id) {
    await this.simulateDelay(500);
    const exam = mockDb.findExam(id);
    if (exam) return { ...exam };
    throw new Error('Exam not found');
  }

  async createExam(exam) {
    await this.simulateDelay(1000);
    const newExam = {
      ...exam,
      id: `EX${Math.floor(Math.random() * 900) + 100}`,
    };
    mockDb.addExam(newExam);
    return newExam;
  }
}

export const examService = new ExamService();
