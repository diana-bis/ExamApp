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
            const maxNum = (mockDb.data.exams ?? [])
                .map(e => parseInt(e.id.replace('EX', ''), 10))
                .filter(n => !isNaN(n))
                .reduce((max, n) => Math.max(max, n), 0);
            const newExam = { id: `EX${String(maxNum + 1).padStart(3, '0')}`, status: 'draft', ...exam };
            mockDb.addExam(newExam);
            return newExam;
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exam),
        });
        return res.json();
    }

    async updateExam(id, data) {
        await this.simulateDelay(800);
        if (configService.isMockMode()) {
            const updated = mockDb.updateExam(id, data);
            if (!updated) throw new Error('Exam not found');
            return { ...updated };
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update exam');
        return res.json();
    }

    async deleteExam(id) {
        await this.simulateDelay(600);
        if (configService.isMockMode()) {
            mockDb.deleteExam(id);
            return;
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/exams/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete exam');
    }
}

export const examService = new ExamService();
