import { storageService } from './StorageService';
import { configService } from './ConfigService';
import { mockDb } from '../api/mockDb';

const USER_KEY = 'current_user';

class AuthService {
    async login(username, password) {
        if (configService.isMockMode()) {
            const found = mockDb.findUser(username);
            if (!found) {
                const error = new Error('Username not found');
                error.field = 'username';
                throw error;
            }
            if (found.password !== password) {
                const error = new Error('Incorrect password');
                error.field = 'password';
                throw error;
            }
            const user = { id: found.id, username: found.username, name: found.name, role: found.role, token: 'mock-token' };
            storageService.saveItem(USER_KEY, user);
            return user;
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const user = await res.json();
        storageService.saveItem(USER_KEY, user);
        return user;
    }

    async register({ name, username, password, role }) {
        if (configService.isMockMode()) {
            if (mockDb.findUser(username)) {
                const error = new Error('Username is already taken');
                error.field = 'username';
                throw error;
            }
            const newUser = { id: `U${Date.now()}`, username: username.trim(), password, role, name: name.trim() };
            mockDb.addUser(newUser);
            return newUser;
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password, role }),
        });
        return res.json();
    }

    logout() {
        storageService.removeItem(USER_KEY);
        return Promise.resolve();
    }

    getCurrentUser() {
        return storageService.getItem(USER_KEY);
    }

    async getUsers() {
        if (configService.isMockMode()) {
            return mockDb.data.users.map(({ password, ...u }) => u);
        }
        const res = await fetch(`${configService.getApiBaseUrl()}/users`);
        return res.json();
    }
}

export const authService = new AuthService();
