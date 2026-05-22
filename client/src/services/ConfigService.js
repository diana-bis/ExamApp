
class ConfigService {
    getAppName() {
        return 'E-Test System';
    }

    getApiBaseUrl() {
        return '/api';
    }

    getDefaultRole() {
        return 'teacher';
    }

    /*
     * Controls whether the API layer uses the in-memory mockDb or real HTTP calls.
     * true  → mockDb, simulated delays.
     * false → ExamService / SubmissionService switch to fetch() against getApiBaseUrl().
     *         Flip this to false once a real backend is connected.
     */
    isMockMode() {
        return true;
    }
}

export const configService = new ConfigService();
