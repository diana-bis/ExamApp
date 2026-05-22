import { configService } from '../services/ConfigService';

class BaseApiService {
    simulateDelay(duration = 500) {
        if (!configService.isMockMode()) return Promise.resolve();
        return new Promise((resolve) => setTimeout(resolve, duration));
    }

    handleError(error) {
        console.error('[BaseApiService] Error:', error);
        throw error;
    }
}

export default BaseApiService;
