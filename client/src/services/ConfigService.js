
class ConfigService {
    getAppName() {
        return 'E-Test System';
    }

    /*
     * Base URL for all API fetch calls (server mode only).
     * Reads VITE_API_BASE_URL from client/.env.local
     * Defaults to http://localhost:3001/api if the variable is not set.
     */
    getApiBaseUrl() {
        return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    }

    /*
     * Controls whether the API layer uses the in-memory mockDb or real HTTP calls.
     * true  → mockDb, simulated delays (default — safe when env var is absent).
     * false → real backend mode. Services switch to real fetch() HTTP requests using getApiBaseUrl().
     *
     * To switch to server mode:
     *   1. Open client/.env.local
     *   2. Set VITE_MOCK_MODE=false
     *   3. Restart the client dev server (npm run dev)
     */
    isMockMode() {
        return import.meta.env.VITE_MOCK_MODE !== 'false';
    }
}

// export a singleton instance of the ConfigService class
export const configService = new ConfigService();
