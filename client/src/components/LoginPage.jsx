import React, { useState } from 'react';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            notifyService.notifyError('Please enter both username and password.');
            return;
        }
        setLoading(true);
        loggerService.log(`Login attempt — username: "${username.trim()}"`);
        try {
            const user = await authService.login(username.trim(), password.trim());
            loggerService.log(`Login success — user: ${user.username}, role: ${user.role}`);
            notifyService.notifySuccess(`Welcome, ${user.username}!`);
            onLogin(user);
        } catch (err) {
            loggerService.error('Login failed:', err.message);
            notifyService.notifyError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="card shadow" style={{ width: '100%', maxWidth: '420px' }}>
                <div className="card-header bg-primary text-white text-center py-3">
                    <h4 className="mb-0">E-Test System</h4>
                    <small className="opacity-75">Sign in to continue</small>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label fw-semibold">Username</label>
                            <input
                                id="username"
                                type="text"
                                className="form-control"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-semibold">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <div className="card-footer text-center text-muted small py-2">
                    Username <strong>teacher</strong> → Teacher view &nbsp;|&nbsp; any other → Student view
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
