import React, { useState } from 'react';
import { mockDb } from '../api/mockDb';
import { examService } from '../api/ExamService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const ResultBox = ({ result }) => {
    if (!result) return null;
    const isError = result.ok === false;
    return (
        <pre
            className={`mt-2 p-2 rounded small mb-0 ${isError ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
        >
            {typeof result.data === 'object'
                ? JSON.stringify(result.data, null, 2)
                : String(result.data)}
        </pre>
    );
};

const ServiceTestPage = () => {
    const [sessionUser, setSessionUser] = useState(() => authService.getCurrentUser());
    const [authResult, setAuthResult] = useState(null);
    const [examResult, setExamResult] = useState(null);
    const [usersResult, setUsersResult] = useState(null);
    const [logHistory, setLogHistory] = useState([]);

    const refreshSession = () => setSessionUser(authService.getCurrentUser());

    // Auth
    const loginAs = async (role) => {
        const creds = { teacher: ['teacher', 'password'], student: ['student', 'password'] }[role];
        try {
            const user = await authService.login(...creds);
            notifyService.notifySuccess(`Logged in as ${user.name}`);
            loggerService.log(`ServiceTest › login as ${role}:`, user);
            refreshSession();
            setAuthResult({ ok: true, data: user });
        } catch (err) {
            loggerService.error('ServiceTest › login failed:', err.message);
            setAuthResult({ ok: false, data: err.message });
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        notifyService.notifyInfo('Logged out.');
        loggerService.log('ServiceTest › logout');
        refreshSession();
        setAuthResult({ ok: true, data: 'Logged out — session cleared.' });
    };

    const handleCheckAuth = () => {
        const user = authService.getCurrentUser();
        loggerService.log('ServiceTest › getCurrentUser():', user);
        setAuthResult({ ok: true, data: user ?? 'No user in session' });
    };

    // Exams
    const handleGetAllExams = async () => {
        try {
            const exams = await examService.getAllExams();
            loggerService.log('ServiceTest › getAllExams():', exams);
            setExamResult({ ok: true, data: exams.map(e => ({ id: e.id, title: e.title, questions: e.questions.length })) });
        } catch (err) {
            loggerService.error('ServiceTest › getAllExams() failed:', err.message);
            setExamResult({ ok: false, data: err.message });
        }
    };

    const handleGetExamById = async () => {
        try {
            const exam = await examService.getExamById('EX001');
            loggerService.log('ServiceTest › getExamById("EX001"):', exam);
            setExamResult({ ok: true, data: { id: exam.id, title: exam.title, questions: exam.questions.length } });
        } catch (err) {
            loggerService.error('ServiceTest › getExamById() failed:', err.message);
            setExamResult({ ok: false, data: err.message });
        }
    };

    // DB stats
    const db = mockDb.data ?? {};
    const stats = [
        { label: 'Users', value: db.users?.length ?? 0 },
        { label: 'Exams', value: db.exams?.length ?? 0 },
        { label: 'Submissions', value: db.submissions?.length ?? 0 },
    ];

    return (
        <div className="container mt-4 mb-5" style={{ maxWidth: 680 }}>
            <div className="card shadow">
                <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Service Test Panel</h5>
                    <span className="badge bg-light text-dark">Dev / Debug</span>
                </div>

                <div className="card-body p-4 d-flex flex-column gap-4">

                    {/* Current session */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">Current Session</p>
                        {sessionUser ? (
                            <div className="alert alert-success py-2 mb-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{sessionUser.name}</strong>
                                </div>
                                <span className={`badge ${sessionUser.role === 'teacher' ? 'bg-primary' : 'bg-success'}`}>
                                    {sessionUser.role}
                                </span>
                            </div>
                        ) : (
                            <div className="alert alert-secondary py-2 mb-0 text-muted small">
                                Not logged in
                            </div>
                        )}
                    </div>

                    {/* Auth actions */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">Auth</p>
                        <div className="d-flex flex-wrap gap-2">
                            <button className="btn btn-primary btn-sm" onClick={() => loginAs('teacher')}>Login as Teacher</button>
                            <button className="btn btn-success btn-sm" onClick={() => loginAs('student')}>Login as Student</button>
                            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={handleCheckAuth}>Check Auth User (in console)</button>
                        </div>
                        <ResultBox result={authResult} />
                    </div>

                    {/* Notifications */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">Notifications</p>
                        <div className="d-flex flex-wrap gap-2">
                            <button className="btn btn-success btn-sm" onClick={() => notifyService.notifySuccess('Success toast is working!')}>Success</button>
                            <button className="btn btn-danger btn-sm" onClick={() => notifyService.notifyError('Error toast is working!')}>Error</button>
                            <button className="btn btn-info btn-sm text-white" onClick={() => notifyService.notifyInfo('Info toast is working!')}>Info</button>
                        </div>
                    </div>

                    {/* Logger */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">Logger</p>
                        <p className="text-muted small mb-2">
                            Central logging wrapper — adds timestamps and keeps an in-memory history (last 50 entries).
                            All services and components call <code>loggerService</code> instead of <code>console</code> directly,
                            so output format and destination can be changed in one place.
                        </p>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    loggerService.log('ServiceTest › log — working');
                                    loggerService.warn('ServiceTest › warn — working');
                                    loggerService.error('ServiceTest › error — working');
                                    setLogHistory(loggerService.getHistory());
                                }}
                            >
                                Fire log / warn / error
                            </button>
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => setLogHistory(loggerService.getHistory())}
                            >
                                View History
                            </button>
                            <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => { loggerService.clearHistory(); setLogHistory([]); }}
                            >
                                Clear History
                            </button>
                        </div>
                        {logHistory.length > 0 && (
                            <div className="border rounded p-2" style={{ maxHeight: 200, overflowY: 'auto' }}>
                                {logHistory.map((entry, i) => (
                                    <div key={i} className="small font-monospace d-flex gap-2">
                                        <span className="text-muted">{entry.time}</span>
                                        <span className={
                                            entry.level === 'ERROR' ? 'text-danger' :
                                            entry.level === 'WARN'  ? 'text-warning' : 'text-secondary'
                                        }>
                                            [{entry.level}]
                                        </span>
                                        <span>{entry.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Exam service */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">Exam Service</p>
                        <div className="d-flex flex-wrap gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={handleGetAllExams}>Get All Exams</button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={handleGetExamById}>Get Exam EX001</button>
                        </div>
                        <ResultBox result={examResult} />
                    </div>

                    {/* DB Users */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">DB Users</p>
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => {
                                    const users = (mockDb.data?.users ?? []).map(u => ({
                                        id: u.id,
                                        username: u.username,
                                        name: u.name,
                                        role: u.role,
                                    }));
                                    loggerService.log('ServiceTest › all users:', users);
                                    setUsersResult({ ok: true, data: users });
                                }}
                            >
                                View All Users
                            </button>
                        </div>
                        <ResultBox result={usersResult} />
                    </div>

                    {/* DB snapshot */}
                    <div>
                        <p className="fw-semibold text-uppercase small text-muted mb-2">DB Snapshot</p>
                        <div className="d-flex gap-3">
                            {stats.map(s => (
                                <div key={s.label} className="border rounded px-3 py-2 text-center" style={{ minWidth: 90 }}>
                                    <div className="fs-5 fw-bold">{s.value}</div>
                                    <div className="text-muted small">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ServiceTestPage;
