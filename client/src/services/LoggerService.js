/*
 * LoggerService — centralised logging wrapper for the E-Test System.
 *
 * Purpose:
 *   All application code calls loggerService instead of console directly.
 *   This lets us:
 *     - Prepend a consistent [LOG/WARN/ERROR] prefix and timestamp to every entry.
 *     - Keep an in-memory history of recent log entries (capped at MAX_HISTORY).
 *
 */

// maximum number of log entries kept in memory
const MAX_HISTORY = 50;

class LoggerService {
    // constructor runs once when service is created 
    constructor() {
        this._history = [];
    }

    // generate current time in HH:MM:SS format
    _timestamp() {
        return new Date().toLocaleTimeString('en-GB', { hour12: false });
    }

    // internal helper method used by log/warn/error
    _record(level, args) {
        // create log object (level=LOG/WARN/ERROR)
        const entry = { level, time: this._timestamp(), message: args.map(String).join(' ') };
        // add newest entry to beginning of array
        this._history.unshift(entry);
        // trim history if it exceeds max size
        if (this._history.length > MAX_HISTORY) this._history.pop();
    }

    log(...args) {
        // save log in history
        this._record('LOG', args);
        // print formatted message to browser console
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

    // return a copy of the log history array
    getHistory() {
        return [...this._history];
    }

    // remove all saved log entries 
    clearHistory() {
        this._history = [];
    }
}

// export a singleton instance of the LoggerService class
export const loggerService = new LoggerService();
