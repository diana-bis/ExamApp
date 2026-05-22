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
}

export const configService = new ConfigService();
