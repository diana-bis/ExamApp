import { storageService } from './StorageService';
import { mockDb } from '../api/mockDb';

const USER_KEY = 'current_user';

class AuthService {
    login(username, password) {
        const found = mockDb.findUser(username);
        if (!found) {
            const error = new Error('Username not found');
            error.field = 'username';
            return Promise.reject(error);
        }
        if (found.password !== password) {
            const error = new Error('Incorrect password');
            error.field = 'password';
            return Promise.reject(error);
        }
        const user = {
            id: found.id,
            username: found.username,
            name: found.name,
            role: found.role,
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
