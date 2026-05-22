import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [invalidField, setInvalidField] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUsername || !trimmedPassword) {
            setErrorMessage('Please enter both username and password.');
            setInvalidField(!trimmedUsername ? 'username' : 'password');
            notifyService.notifyError('Please enter both username and password.');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setInvalidField('');
        loggerService.log(`Login attempt — username: "${trimmedUsername}"`);
        try {
            const user = await authService.login(trimmedUsername, trimmedPassword);
            loggerService.log(`Login success — user: ${user.username}, role: ${user.role}`);
            notifyService.notifySuccess(`Welcome, ${user.name || user.username}!`);
            onLogin(user);
        } catch (err) {
            const message = err.message || 'Login failed. Please try again.';
            const field = err.field || '';
            setErrorMessage(message);
            setInvalidField(field);
            loggerService.error('Login failed:', message);
            notifyService.notifyError(message);
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
                                className={`form-control ${invalidField === 'username' ? 'is-invalid' : ''}`}
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (invalidField === 'username') {
                                        setInvalidField('');
                                        setErrorMessage('');
                                    }
                                }}
                                autoComplete="username"
                                autoFocus
                            />
                            {invalidField === 'username' && (
                                <div className="invalid-feedback">{errorMessage}</div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-semibold">Password</label>
                            <div className="input-group">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${invalidField === 'password' ? 'is-invalid' : ''}`}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (invalidField === 'password') {
                                            setInvalidField('');
                                            setErrorMessage('');
                                        }
                                    }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {invalidField === 'password' && (
                                <div className="invalid-feedback d-block">{errorMessage}</div>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                        {!invalidField && errorMessage && (
                            <div className="alert alert-danger mt-3" role="alert">
                                {errorMessage}
                            </div>
                        )}
                    </form>
                </div>
                <div className="card-footer text-center text-muted small py-2">
                    <div><strong>teacher</strong> / password &nbsp;|&nbsp; <strong>student</strong> / password</div>
                    <div className="mt-1">No account? <Link to="/register">Register here</Link></div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
