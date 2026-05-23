// import global configuration service - used here to check whether app runs in mock mode
import { configService } from '../services/ConfigService';

/*
 * BaseApiService
 *
 * Parent/base class for all API services.
 *
 * Purpose:
 *   Shared reusable API-related logic lives here so that
 *   child services do not duplicate code.
 *
 * Current shared functionality:
 *   - simulateDelay() for fake network latency in mock mode
 *   - handleError() for centralized API error handling
 *
 * Child classes:
 *   - ExamService
 *   - SubmissionService
 */

class BaseApiService {

    // Simulates backend/network delay when in mock mode
    simulateDelay(duration = 500) {
        // if not in mock mode, resolve immediately without delay
        if (!configService.isMockMode()) return Promise.resolve();
        // return a promise that resolves after the specified duration (ms)
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    // Centralized error handling for API calls
    handleError(error) {
        console.error('[BaseApiService] Error:', error);
        throw error;
    }
}

// export the BaseApiService class so that it can be extended by child API service classes
export default BaseApiService;
