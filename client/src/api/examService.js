import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';
import { configService } from '../services/ConfigService';

/*
 * ExamService
 *
 * Responsible for all exam-related operations:
 *   - get all exams
 *   - get exam by id
 *   - create exam
 *   - update exam
 *   - delete exam
 *
 * This class extends BaseApiService
 * to reuse shared API functionality.
 */

export class ExamService extends BaseApiService {
  // get all exams (for teacher dashboard and student portal)
  async getAllExams() {
    // MOCK MODE — return exams from mockDb instead of making real API call
    if (configService.isMockMode()) {
      await this.simulateDelay(800);
      return mockDb.data.exams.map(e => ({ ...e }));
    }

    // REAL MODE — send GET request to backend API
    const res = await fetch(`${configService.getApiBaseUrl()}/exams`);

    // check HTTP success
    if (!res.ok) throw new Error('Failed to fetch exams');
    return res.json();
  }

  // get one exam by id (used when student starts an exam or teacher views details)
  async getExamById(id) {
    // MOCK MODE — find exam in mockDb instead of making real API call
    if (configService.isMockMode()) {
      await this.simulateDelay(500);
      const exam = mockDb.findExam(id);

      // if exam found, return copy
      if (exam) return { ...exam };
      throw new Error('Exam not found');
    }

    // REAL MODE — send GET request to backend API
    const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`);

    // check HTTP success
    if (!res.ok) throw new Error('Exam not found');
    return res.json();
  }

  // create new exam (used by teacher when creating an exam)
  async createExam(exam) {
    // MOCK MODE — add exam to mockDb instead of making real API call
    if (configService.isMockMode()) {
      await this.simulateDelay(1000);
      // generate new exam ID by finding max existing ID and adding 1
      const maxNum = (mockDb.data.exams ?? [])
        .map(e => parseInt(e.id.replace('EX', ''), 10))
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0);
      const newExam = { id: `EX${String(maxNum + 1).padStart(3, '0')}`, status: 'draft', ...exam };
      mockDb.addExam(newExam);
      return newExam;
    }

    // REAL BACKEND MODE — send POST request to backend API
    const res = await fetch(`${configService.getApiBaseUrl()}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });

    // check HTTP success
    if (!res.ok) throw new Error('Failed to create exam');
    return res.json();
  }

  // update existing exam by id (used by teacher when editing an exam or toggling status)
  async updateExam(id, data) {
    // MOCK MODE — update exam in mockDb instead of making real API call
    if (configService.isMockMode()) {
      await this.simulateDelay(800);
      // update exam in mockDb and return updated exam
      const updated = mockDb.updateExam(id, data);

      if (!updated) throw new Error('Exam not found');
      return { ...updated };
    }

    // REAL MODE — send PUT request to backend API
    const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // check HTTP success
    if (!res.ok) throw new Error('Failed to update exam');
    return res.json();
  }

  // delete exam by id (used by teacher when deleting an exam)
  async deleteExam(id) {
    // MOCK MODE — delete exam from mockDb instead of making real API call
    if (configService.isMockMode()) {
      await this.simulateDelay(600);
      mockDb.deleteExam(id);
      return;
    }

    // REAL MODE — send DELETE request to backend API
    const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`, {
      method: 'DELETE',
    });

    // check HTTP success
    if (!res.ok) throw new Error('Failed to delete exam');
  }
}

// export a singleton instance of the ExamService class
export const examService = new ExamService();
