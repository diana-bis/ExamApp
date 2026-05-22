class LoggerService {
    log(...args) {
        console.log('[Logger]', ...args);
    }

    warn(...args) {
        console.warn('[Logger]', ...args);
    }

    error(...args) {
        console.error('[Logger]', ...args);
    }
}

export const loggerService = new LoggerService();
