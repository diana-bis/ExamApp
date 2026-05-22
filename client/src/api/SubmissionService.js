import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';
import { configService } from '../services/ConfigService';

class SubmissionService extends BaseApiService {
    async submitExam(submission) {
        await this.simulateDelay(800);
        if (configService.isMockMode()) {
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
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission),
        });
        return res.json();
    }

    async getSubmissions() {
        await this.simulateDelay(600);
        if (configService.isMockMode()) {
            return mockDb.getSubmissions();
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions`);
        return res.json();
    }

    async getSubmissionsByExam(examId) {
        await this.simulateDelay(600);
        if (configService.isMockMode()) {
            return mockDb.getSubmissions().filter(s => s.examId === examId);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions?examId=${examId}`);
        return res.json();
    }

    async getSubmissionById(id) {
        await this.simulateDelay(500);
        if (configService.isMockMode()) {
            return mockDb.getSubmissionById(id);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions/${id}`);
        return res.json();
    }
}

export const submissionService = new SubmissionService();
