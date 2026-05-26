import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const BG_GRADIENT   = 'linear-gradient(135deg, #1a237e 0%, #4527a0 40%, #0288d1 100%)';
const CARD_GRADIENT = 'linear-gradient(135deg, #4527a0 0%, #0288d1 100%)';

const LoginPage = ({ onLogin }) => {
    // form state
    const [username, setUsername]       = useState('');
    const [password, setPassword]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    // stores which field currently has validation error - possible values: 'username'/'password'
    const [invalidField, setInvalidField] = useState('');

    const handleSubmit = async (e) => {
        // prevent form from reloading page
        e.preventDefault();
        // trim inputs to avoid issues with leading/trailing spaces
        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim();

        // frontend validation - check if both fields are filled
        if (!trimmedUsername || !trimmedPassword) {
            setErrorMessage('Please enter both username and password.');
            // set which field is invalid to show error styles
            setInvalidField(!trimmedUsername ? 'username' : 'password');
            // show toast notification
            notifyService.notifyError('Please enter both username and password.');
            return;
        }

        // reset error states and show loading state
        setLoading(true);
        setErrorMessage('');
        setInvalidField('');
        // log login attempt
        loggerService.log(`Login attempt — username: "${trimmedUsername}"`);
        // call auth service to perform login - this will throw an error if login fails
        try {
            const user = await authService.login(trimmedUsername, trimmedPassword);
            // log successful login and notify with toast
            loggerService.log(`Login success — user: ${user.username}, role: ${user.role}`);
            notifyService.notifySuccess(`Welcome, ${user.name || user.username}!`);
            onLogin(user);
        } catch (err) {
            const message = err.message || 'Login failed. Please try again.';
            const field   = err.field || '';
            setErrorMessage(message);
            setInvalidField(field);
            loggerService.error('Login failed:', message);
            notifyService.notifyError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh', background: BG_GRADIENT, padding: '2rem 1rem' }}
        >
            <style>{`
              @keyframes fadeUp {
                from { opacity: 0; transform: translateY(24px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .login-card { animation: fadeUp 0.45s ease forwards; }
              .login-input:focus { border-color: #7c4dff !important; box-shadow: 0 0 0 3px rgba(124,77,255,0.15) !important; outline: none; }
              .login-btn { transition: opacity 0.2s, transform 0.15s; }
              .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
            `}</style>

            {/* Login form card */}
            <div className="login-card shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: 420 }}>

                {/* Header */}
                <div className="text-white text-center py-4 px-4" style={{ background: CARD_GRADIENT }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)' }}>
                        <i className="bi bi-mortarboard-fill" style={{ fontSize: '1.8rem' }}></i>
                    </div>
                    <h4 className="fw-bold mb-1">E-Test System</h4>
                    <small className="opacity-75">Sign in to continue</small>
                </div>

                {/* Body */}
                <div className="p-4" style={{ background: '#fff' }}>
                    <form onSubmit={handleSubmit} noValidate>

                        {/* Username field */}
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Username
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#f3e5f5', border: '1px solid #d1c4e9', borderRight: 'none' }}>
                                    <i className="bi bi-person" style={{ color: '#7c4dff' }}></i>
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    className={`login-input form-control ${invalidField === 'username' ? 'is-invalid' : ''}`}
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (invalidField === 'username') { setInvalidField(''); setErrorMessage(''); }
                                    }}
                                    autoComplete="username"
                                    autoFocus
                                    style={{ background: '#faf5ff', border: '1px solid #d1c4e9', borderLeft: 'none' }}
                                />
                            </div>
                            {invalidField === 'username' && (
                                <div className="invalid-feedback d-block">{errorMessage}</div>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Password
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={{ background: '#f3e5f5', border: '1px solid #d1c4e9', borderRight: 'none' }}>
                                    <i className="bi bi-lock" style={{ color: '#7c4dff' }}></i>
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`login-input form-control ${invalidField === 'password' ? 'is-invalid' : ''}`}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (invalidField === 'password') { setInvalidField(''); setErrorMessage(''); }
                                    }}
                                    autoComplete="current-password"
                                    style={{ background: '#faf5ff', border: '1px solid #d1c4e9', borderLeft: 'none', borderRight: 'none' }}
                                />
                                {/* Button to toggle password visibility */}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{ background: '#f3e5f5', border: '1px solid #d1c4e9', borderLeft: 'none', color: '#7c4dff' }}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            {invalidField === 'password' && (
                                <div className="invalid-feedback d-block">{errorMessage}</div>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="login-btn btn w-100 text-white fw-semibold py-2"
                            disabled={loading}
                            style={{ background: CARD_GRADIENT, border: 'none', borderRadius: 8, fontSize: '1rem' }}
                        >
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
                                : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                            }
                        </button>

                        {!invalidField && errorMessage && (
                            <div className="alert alert-danger mt-3 py-2 small" role="alert">
                                <i className="bi bi-exclamation-circle me-2"></i>{errorMessage}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center small py-3 px-4" style={{ background: '#faf5ff', borderTop: '1px solid #e8d5f5' }}>
                    {/* mock credentials */}
                    <div className="text-muted mb-1">
                        <i className="bi bi-info-circle me-1"></i>
                        <strong>teacher</strong> / password &nbsp;·&nbsp; <strong>student</strong> / password
                    </div>
                    {/* navigation to register page */}
                    <div className="text-muted">
                        No account?{' '}
                        <Link to="/register" style={{ color: '#4527a0', fontWeight: 600 }}>Register here</Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
