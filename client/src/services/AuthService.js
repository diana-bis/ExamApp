import { storageService } from './StorageService';

const USER_KEY = 'current_user';

class AuthService {
    login(username, password) {
        const user = {
            username,
            role: username === 'teacher' ? 'teacher' : 'student',
            token: 'mock-token',
        };
        storageService.saveItem(USER_KEY, user);
        return Promise.resolve(user);
    }

    logout() {
        storageService.removeItem(USER_KEY);
        return Promise.resolve();
    }

    getCurrentUser() {
        return storageService.getItem(USER_KEY);
    }
}

export const authService = new AuthService();
