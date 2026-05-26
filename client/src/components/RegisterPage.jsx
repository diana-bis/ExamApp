import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const BG_GRADIENT   = 'linear-gradient(135deg, #1a237e 0%, #4527a0 40%, #0288d1 100%)';
const CARD_GRADIENT = 'linear-gradient(135deg, #4527a0 0%, #0288d1 100%)';

const RegisterPage = () => {
    // navigation hook to redirect after successful registration
    const navigate = useNavigate();
    // form state
    const [form, setFormState] = useState({ name: '', username: '', password: '', confirmPassword: '', role: 'student' });
    // state for toggling password visibility
    const [showPassword,        setShowPassword]        = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors,  setErrors]  = useState({});
    // loading state to disable form while request is in progress
    const [loading, setLoading] = useState(false);

    // helper to update form state and clear field-specific errors on change
    const setField = (field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // frontend validation to check form fields before submitting
    const validate = () => {
        const next = {};
        if (!form.name.trim())     next.name     = 'Name is required.';
        if (!form.username.trim()) next.username  = 'Username is required.';
        if (!form.password)        next.password  = 'Password is required.';
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
                name:     form.name,
                username: form.username,
                password: form.password,
                role:     form.role,
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

    // shared input style
    const inputStyle = { background: '#faf5ff', border: '1px solid #d1c4e9', borderLeft: 'none' };
    const adornStyle = { background: '#f3e5f5', border: '1px solid #d1c4e9', borderRight: 'none', color: '#7c4dff' };

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
              .reg-card { animation: fadeUp 0.45s ease forwards; }
              .reg-input:focus { border-color: #7c4dff !important; box-shadow: 0 0 0 3px rgba(124,77,255,0.15) !important; outline: none; }
              .reg-btn { transition: opacity 0.2s, transform 0.15s; }
              .reg-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
              .role-card { cursor: pointer; border: 2px solid #d1c4e9; border-radius: 10px; padding: 0.6rem 1.2rem; transition: border-color 0.2s, background 0.2s; }
              .role-card.active { border-color: #7c4dff; background: #f3e5f5; }
            `}</style>

            {/* Register card */}
            <div className="reg-card shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: 460 }}>

                {/* Header */}
                <div className="text-white text-center py-4 px-4" style={{ background: CARD_GRADIENT }}>
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)' }}>
                        <i className="bi bi-person-plus-fill" style={{ fontSize: '1.8rem' }}></i>
                    </div>
                    <h4 className="fw-bold mb-1">E-Test System</h4>
                    <small className="opacity-75">Create your account</small>
                </div>

                {/* Body */}
                <div className="p-4" style={{ background: '#fff' }}>
                    <form onSubmit={handleSubmit} noValidate>

                        {/* Full Name */}
                        <div className="mb-3">
                            <label htmlFor="reg-name" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Full Name
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={adornStyle}>
                                    <i className="bi bi-person-badge"></i>
                                </span>
                                <input
                                    id="reg-name"
                                    type="text"
                                    className={`reg-input form-control ${errors.name ? 'is-invalid' : ''}`}
                                    placeholder="Enter your name"
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    autoFocus
                                    style={inputStyle}
                                />
                            </div>
                            {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                        </div>

                        {/* Username */}
                        <div className="mb-3">
                            <label htmlFor="reg-username" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Username
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={adornStyle}>
                                    <i className="bi bi-at"></i>
                                </span>
                                <input
                                    id="reg-username"
                                    type="text"
                                    className={`reg-input form-control ${errors.username ? 'is-invalid' : ''}`}
                                    placeholder="Choose a username"
                                    value={form.username}
                                    onChange={e => setField('username', e.target.value)}
                                    autoComplete="username"
                                    style={inputStyle}
                                />
                            </div>
                            {errors.username && <div className="invalid-feedback d-block">{errors.username}</div>}
                        </div>

                        {/* Password */}
                        <div className="mb-3">
                            <label htmlFor="reg-password" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Password
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={adornStyle}>
                                    <i className="bi bi-lock"></i>
                                </span>
                                <input
                                    id="reg-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className={`reg-input form-control ${errors.password ? 'is-invalid' : ''}`}
                                    placeholder="Min. 6 characters"
                                    value={form.password}
                                    onChange={e => setField('password', e.target.value)}
                                    autoComplete="new-password"
                                    style={{ ...inputStyle, borderRight: 'none' }}
                                />
                                {/* password visibility toggle */}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{ background: '#f3e5f5', border: '1px solid #d1c4e9', borderLeft: 'none', color: '#7c4dff' }}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3">
                            <label htmlFor="reg-confirm" className="form-label fw-semibold small" style={{ color: '#4527a0' }}>
                                Confirm Password
                            </label>
                            <div className="input-group">
                                <span className="input-group-text" style={adornStyle}>
                                    <i className="bi bi-lock-fill"></i>
                                </span>
                                <input
                                    id="reg-confirm"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`reg-input form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                    placeholder="Repeat your password"
                                    value={form.confirmPassword}
                                    onChange={e => setField('confirmPassword', e.target.value)}
                                    autoComplete="new-password"
                                    style={{ ...inputStyle, borderRight: 'none' }}
                                />
                                {/* password visibility toggle */}
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    style={{ background: '#f3e5f5', border: '1px solid #d1c4e9', borderLeft: 'none', color: '#7c4dff' }}
                                >
                                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
                        </div>

                        {/* ROLE SELECTION */}
                        <div className="mb-4">
                            <label className="form-label fw-semibold small d-block" style={{ color: '#4527a0' }}>I am a…</label>
                            <div className="d-flex gap-3">
                                {[
                                    { value: 'student', icon: 'bi-journal-text',   label: 'Student' },
                                    { value: 'teacher', icon: 'bi-person-workspace', label: 'Teacher' },
                                ].map(r => (
                                    <div
                                        key={r.value}
                                        className={`role-card d-flex align-items-center gap-2 flex-fill justify-content-center ${form.role === r.value ? 'active' : ''}`}
                                        onClick={() => setField('role', r.value)}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            id={`role-${r.value}`}
                                            value={r.value}
                                            checked={form.role === r.value}
                                            onChange={() => setField('role', r.value)}
                                            style={{ accentColor: '#7c4dff' }}
                                        />
                                        <label htmlFor={`role-${r.value}`} className="mb-0 fw-semibold" style={{ cursor: 'pointer', color: '#4527a0' }}>
                                            <i className={`bi ${r.icon} me-1`}></i>{r.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="reg-btn btn w-100 text-white fw-semibold py-2"
                            disabled={loading}
                            style={{ background: CARD_GRADIENT, border: 'none', borderRadius: 8, fontSize: '1rem' }}
                        >
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account...</>
                                : <><i className="bi bi-person-check me-2"></i>Register</>
                            }
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center small py-3 px-4" style={{ background: '#faf5ff', borderTop: '1px solid #e8d5f5' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#4527a0', fontWeight: 600 }}>Sign in</Link>
                </div>

            </div>
        </div>
    );
};

export default RegisterPage;
