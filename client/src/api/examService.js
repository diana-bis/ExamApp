import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';
import { configService } from '../services/ConfigService';

export class ExamService extends BaseApiService {
    async getAllExams() {
        await this.simulateDelay(800);
        if (configService.isMockMode()) {
            return mockDb.data.exams.map(e => ({ ...e }));
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams`);
        return res.json();
    }

    async getExamById(id) {
        await this.simulateDelay(500);
        if (configService.isMockMode()) {
            const exam = mockDb.findExam(id);
            if (exam) return { ...exam };
            throw new Error('Exam not found');
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`);
        if (!res.ok) throw new Error('Exam not found');
        return res.json();
    }

    async createExam(exam) {
        await this.simulateDelay(1000);
        if (configService.isMockMode()) {
            mockDb.addExam(exam);
            return exam;
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exam),
        });
        return res.json();
    }
}

export const examService = new ExamService();
