class StorageService {
    saveItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('[StorageService] Save failed:', error);
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('[StorageService] Read failed:', error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('[StorageService] Remove failed:', error);
        }
    }
}

export const storageService = new StorageService();
