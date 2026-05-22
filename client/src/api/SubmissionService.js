import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';

class SubmissionService extends BaseApiService {
  async submitExam(submission) {
    await this.simulateDelay(800);
    const record = {
      id: `SUB${Date.now()}`,
      studentId: submission.studentId,
      examId: submission.examId,
      answers: submission.answers,
      grade: submission.grade,
      submittedAt: new Date().toISOString(),
    };
    mockDb.addSubmission(record);
    return record;
  }

  async getSubmissions() {
    await this.simulateDelay(600);
    return mockDb.getSubmissions();
  }

  async getSubmissionById(id) {
    await this.simulateDelay(500);
    return mockDb.getSubmissionById(id);
  }
}

export const submissionService = new SubmissionService();
