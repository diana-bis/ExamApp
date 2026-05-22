class BaseApiService {
    simulateDelay(duration = 500) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    handleError(error) {
        console.error('[BaseApiService] Error:', error);
        throw error;
    }

    // TODO: Add shared API helpers for fetch, retry, auth headers, etc.
}

export default BaseApiService;
