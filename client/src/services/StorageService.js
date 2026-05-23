/* StorageService — wrapper around browser localStorage.
 * Used mainly for:
 *   - storing current logged-in user
 *   - session persistence after refresh
*/

class StorageService {
    // save value into localStorage under a given key
    saveItem(key, value) {
        try {
            // convert value to JSON string before saving in localStorage
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('[StorageService] Save failed:', error);
        }
    }

    // read value from localStorage by key
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            // if item exists, convert JSON string back into JS object, otherwise return null
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('[StorageService] Read failed:', error);
            return null;
        }
    }

    // remove item from localStorage by key
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('[StorageService] Remove failed:', error);
        }
    }
}

// export a singleton instance of the StorageService class
export const storageService = new StorageService();
