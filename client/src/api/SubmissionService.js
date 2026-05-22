class SubmissionService {
    async submitExam(submission) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
            success: true,
            submissionId: `SUB${Date.now()}`,
            submittedAt: new Date().toISOString(),
            ...submission,
        };
    }

    async getSubmissions() {
        await new Promise((resolve) => setTimeout(resolve, 600));
        // TODO: Implement submission history using a mock database or real backend
        return [];
    }

    async getSubmissionById(id) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        // TODO: Return a real submission record when backend storage is available
        return null;
    }
}

export const submissionService = new SubmissionService();
