import BaseApiService from './BaseApiService';
import { mockDb } from './mockDb';
import { configService } from '../services/ConfigService';

// SubmissionService - responsible for all submission-related operations
class SubmissionService extends BaseApiService {
    // submit a completed exam (used when student submits an exam)
    async submitExam(submission) {
        // simulate fake network delay if in mock mode
        await this.simulateDelay(800);
        // // MOCK MODE - save submission into mockDb
        if (configService.isMockMode()) {
            const record = {
                // generate unique id for submission (in real backend, this would be done by the database)
                id: `SUB${Date.now()}`,
                studentId: submission.studentId,
                examId: submission.examId,
                answers: submission.answers,
                grade: submission.grade,
                resultsPublished: submission.resultsPublished ?? true,
                submittedAt: new Date().toISOString(),
            };
            mockDb.addSubmission(record);
            return record;
        }
        // REAL BACKEND MODE
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission),
        });
        return res.json();
    }

    // get submissions for a specific exam id
    async getSubmissionsByExam(examId) {
        await this.simulateDelay(600);
        if (configService.isMockMode()) {
            return mockDb.getSubmissions().filter(s => s.examId === examId);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions?examId=${examId}`);
        return res.json();
    }

    // get one submission by submission id 
    async getSubmissionById(id) {
        await this.simulateDelay(500);
        if (configService.isMockMode()) {
            return mockDb.getSubmissionById(id);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions/${id}`);
        return res.json();
    }

    // get all submissions made by one student (used by student to view their submission history)
    async getSubmissionsByStudent(studentId) {
        await this.simulateDelay(600);
        if (configService.isMockMode()) {
            return mockDb.getSubmissions().filter(s => s.studentId === studentId);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions?studentId=${studentId}`);
        return res.json();
    }

    // get all submissions (used by teacher dashboard for submission counts)
    async getAllSubmissions() {
        await this.simulateDelay(400);
        if (configService.isMockMode()) {
            return mockDb.getSubmissions();
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions`);
        return res.json();
    }

    // update submission by id with new data (used when teacher grades a submission)
    async updateSubmission(id, data) {
        await this.simulateDelay(400);
        if (configService.isMockMode()) {
            return mockDb.updateSubmission(id, data);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/submissions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }
}

// export a singleton instance of the SubmissionService class 
export const submissionService = new SubmissionService();
