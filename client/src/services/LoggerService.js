/*
 * LoggerService — centralised logging wrapper for the E-Test System.
 *
 * Purpose:
 *   All application code calls loggerService instead of console directly.
 *   This lets us:
 *     - Prepend a consistent [LOG/WARN/ERROR] prefix and timestamp to every entry.
 *     - Keep an in-memory history of recent log entries (capped at MAX_HISTORY).
 *     - Swap the underlying output (e.g. send logs to a remote endpoint) in one place.
 *
 * Usage:
 *   loggerService.log('Something happened', payload);
 *   loggerService.warn('Something looks off', value);
 *   loggerService.error('Something broke', error);
 *   loggerService.getHistory();   // returns the last MAX_HISTORY entries
 *   loggerService.clearHistory(); // wipe the in-memory log list
 */

const MAX_HISTORY = 50;

class LoggerService {
    constructor() {
        this._history = [];
    }

    _timestamp() {
        return new Date().toLocaleTimeString('en-GB', { hour12: false });
    }

    _record(level, args) {
        const entry = { level, time: this._timestamp(), message: args.map(String).join(' ') };
        this._history.unshift(entry);
        if (this._history.length > MAX_HISTORY) this._history.pop();
    }

    log(...args) {
        this._record('LOG', args);
        console.log(`[LOG ${this._timestamp()}]`, ...args);
    }

    warn(...args) {
        this._record('WARN', args);
        console.warn(`[WARN ${this._timestamp()}]`, ...args);
    }

    error(...args) {
        this._record('ERROR', args);
        console.error(`[ERROR ${this._timestamp()}]`, ...args);
    }

    getHistory() {
        return [...this._history];
    }

    clearHistory() {
        this._history = [];
    }
}

export const loggerService = new LoggerService();
