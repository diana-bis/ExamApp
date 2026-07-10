import { storageService } from './StorageService';
import { configService } from './ConfigService';
import { mockDb } from '../api/mockDb';

// logged in user is stored in localStorage under this key
const USER_KEY = 'current_user';

// service responsible for authentication and user-related operations
class AuthService {

    async login(username, password) {
        // if app works in mock mode, use local mock database
        if (configService.isMockMode()) {
            const found = mockDb.findUser(username);
            // if username does not exist -> throw username specific error
            if (!found) {
                const error = new Error('Username not found');
                error.field = 'username';
                throw error;
            }
            // if password is incorrect -> throw password specific error
            if (found.password !== password) {
                const error = new Error('Incorrect password');
                error.field = 'password';
                throw error;
            }
            // on successful login, save user info (except password) to localStorage and return user object
            const user = { id: found.id, username: found.username, name: found.name, role: found.role, token: 'mock-token' };
            storageService.saveItem(USER_KEY, user);
            return user;
        }

        // REAL BACKEND LOGIN FLOW (used when mock mode is disabled)
        const res = await fetch(`${configService.getApiBaseUrl()}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            const error = new Error(data.error || 'Login failed');
            error.field = data.field || '';
            throw error;
        }
        storageService.saveItem(USER_KEY, data);
        return data;
    }

    async register({ name, username, password, role }) {
        // in mock mode, check if username is already taken and throw error if so
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
        // REAL BACKEND REGISTRATION FLOW (used when mock mode is disabled)
        const res = await fetch(`${configService.getApiBaseUrl()}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
            const error = new Error(data.error || 'Registration failed');
            error.field = data.field || '';
            throw error;
        }
        return data;
    }

    // logs out the user by removing their info from localStorage
    logout() {
        storageService.removeItem(USER_KEY);
        return Promise.resolve();
    }

    // returns the currently logged in user's info from localStorage (or null if not logged in)
    getCurrentUser() {
        return storageService.getItem(USER_KEY);
    }

    // fetches all users from backend (or mock database) - used for admin features
    async getUsers() {
        // MOCK MODE
        if (configService.isMockMode()) {
            return mockDb.data.users.map(({ password, ...u }) => u);
        }
        // REAL BACKEND FLOW
        const res = await fetch(`${configService.getApiBaseUrl()}/users`);
        return res.json();
    }
}

// export a singleton instance of the AuthService class
export const authService = new AuthService();
