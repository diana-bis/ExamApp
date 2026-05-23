import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const RegisterPage = () => {
    // navigation hook to redirect after successful registration
    const navigate = useNavigate();
    // form state
    const [form, setForm] = useState({ name: '', username: '', password: '', confirmPassword: '', role: 'student' });
    // state for toggling password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    // loading state to disable form while request is in progress
    const [loading, setLoading] = useState(false);

    // helper to update form state and clear field-specific errors on change
    const setField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // frontend validation to check form fields before submitting
    const validate = () => {
        const next = {};
        if (!form.name.trim()) next.name = 'Name is required.';
        if (!form.username.trim()) next.username = 'Username is required.';
        if (!form.password) next.password = 'Password is required.';
        if (form.password.length > 0 && form.password.length < 6)
            next.password = 'Password must be at least 6 characters.';
        if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
        return next;
    };

    // handle form submission
    const handleSubmit = async (e) => {
        // prevent form from reloading page
        e.preventDefault();
        // run frontend validation
        const validationErrors = validate();
        // if validation failed
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // begin loading state
        setLoading(true);
        // log registration attempt
        loggerService.log(`Register attempt — username: "${form.username.trim()}", role: "${form.role}"`);

        // call auth service to perform registration - this will throw an error if registration fails
        try {
            const user = await authService.register({
                name: form.name,
                username: form.username,
                password: form.password,
                role: form.role,
            });
            loggerService.log(`Register success — user: ${user.username}, role: ${user.role}`);
            notifyService.notifySuccess(`Account created! Please sign in, ${user.name}.`);
            navigate('/login');
        } catch (err) {
            const field = err.field || '';
            loggerService.error('Register failed:', err.message);
            if (field) {
                setErrors(prev => ({ ...prev, [field]: err.message }));
            } else {
                notifyService.notifyError(err.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            {/* register card */}
            <div className="card shadow" style={{ width: '100%', maxWidth: '440px' }}>
                <div className="card-header bg-primary text-white text-center py-3">
                    <h4 className="mb-0">E-Test System</h4>
                    <small className="opacity-75">Create an account</small>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit} noValidate>

                        <div className="mb-3">
                            <label htmlFor="reg-name" className="form-label fw-semibold">Full Name</label>
                            <input
                                id="reg-name"
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                placeholder="Enter your name"
                                value={form.name}
                                onChange={e => setField('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="reg-username" className="form-label fw-semibold">Username</label>
                            <input
                                id="reg-username"
                                type="text"
                                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                placeholder="Choose a username"
                                value={form.username}
                                onChange={e => setField('username', e.target.value)}
                                autoComplete="username"
                            />
                            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="reg-password" className="form-label fw-semibold">Password</label>
                            <div className="input-group">
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={e => setField('password', e.target.value)}
                                    autoComplete="new-password"
                                />
                                {/* password visibility toggle */}
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="reg-confirm" className="form-label fw-semibold">Confirm Password</label>
                            <div className="input-group">
                                <input
                                    id="reg-confirm"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    placeholder="Repeat your password"
                                    value={form.confirmPassword}
                                    onChange={e => setField('confirmPassword', e.target.value)}
                                    autoComplete="new-password"
                                />
                                {/* password visibility toggle */}
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                        </div>
                        {/* ROLE SELECTION */}
                        <div className="mb-4">
                            <label className="form-label fw-semibold d-block">Role</label>
                            <div className="d-flex gap-4">
                                {['student', 'teacher'].map(r => (
                                    <div key={r} className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="role"
                                            id={`role-${r}`}
                                            value={r}
                                            checked={form.role === r}
                                            onChange={() => setField('role', r)}
                                        />
                                        <label className="form-check-label text-capitalize" htmlFor={`role-${r}`}>
                                            {r}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </form>
                </div>
                <div className="card-footer text-center text-muted small py-2">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
