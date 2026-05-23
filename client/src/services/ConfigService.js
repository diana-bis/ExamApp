
class ConfigService {
    getAppName() {
        return 'E-Test System';
    }

    getApiBaseUrl() {
        return '/api';
    }

    /*
     * Controls whether the API layer uses the in-memory mockDb or real HTTP calls.
     * true  → mockDb, simulated delays.
     * false → real backend mode. Services switch to real fetch() HTTP requests using getApiBaseUrl().
     * Flip this to false once a real backend is connected.
     */
    isMockMode() {
        return true;
    }
}

// export a singleton instance of the ConfigService class
export const configService = new ConfigService();
