import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const computeGrade = (questions, answers, oeScoresInput) => {
    const totalQ = questions.length;
    if (totalQ === 0) return 0;
    const scores = questions.map(q => {
        if (q.type === 'MULTIPLE_CHOICE') {
            return answers?.[q.id] === q.correctAnswer ? 100 : 0;
        }
        return Math.min(100, Math.max(0, Number(oeScoresInput[q.id]) || 0));
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / totalQ);
};

const ExamScoresPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [gradingSubId, setGradingSubId] = useState(null);
    const [oeScoresInput, setOeScoresInput] = useState({});
    const [useOverride, setUseOverride] = useState(false);
    const [overrideInput, setOverrideInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');

    useEffect(() => {
        Promise.all([
            examService.getExamById(examId),
            submissionService.getSubmissionsByExam(examId),
            authService.getUsers(),
        ])
            .then(([examData, subs, userList]) => {
                setExam(examData);
                setSubmissions(subs);
                setUsers(userList);
            })
            .catch(err => loggerService.error('ExamScoresPage › load failed:', err))
            .finally(() => setLoading(false));
    }, [examId]);

    const openGrading = (sub, questions) => {
        const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');
        setGradingSubId(sub.id);
        setOeScoresInput(
            Object.fromEntries(oeQs.map(q => [q.id, String(sub.oeScores?.[q.id] ?? '')]))
        );
        setUseOverride(false);
        setOverrideInput(String(sub.grade ?? ''));
        setFeedbackInput(sub.feedback ?? '');
    };

    const handlePublish = async (sub) => {
        const resultsPublished = !sub.resultsPublished;
        await submissionService.updateSubmission(sub.id, { resultsPublished });
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, resultsPublished } : s));
        notifyService.notifySuccess(resultsPublished ? 'Results published to student.' : 'Results unpublished.');
        loggerService.log('ExamScoresPage › publish toggle:', sub.id, '→', resultsPublished);
    };

    const handleSaveGrade = async (sub) => {
        const questions = exam.questions || [];
        const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');

        const oeScoresNumeric = Object.fromEntries(
            oeQs.map(q => [q.id, Math.min(100, Math.max(0, Number(oeScoresInput[q.id]) || 0))])
        );

        let grade;
        if (useOverride) {
            grade = Number(overrideInput);
            if (isNaN(grade) || grade < 0 || grade > 100) {
                notifyService.notifyError('Override grade must be between 0 and 100.');
                return;
            }
        } else {
            grade = computeGrade(questions, sub.answers, oeScoresInput);
        }

        const feedback = feedbackInput.trim();
        await submissionService.updateSubmission(sub.id, { grade, feedback, oeScores: oeScoresNumeric });
        setSubmissions(prev =>
            prev.map(s => s.id === sub.id ? { ...s, grade, feedback, oeScores: oeScoresNumeric } : s)
        );
        notifyService.notifySuccess('Grade and feedback saved.');
        loggerService.log('ExamScoresPage › graded submission:', sub.id, 'grade:', grade);
        setGradingSubId(null);
    };

    if (loading) {
        return <div className="container mt-4"><p className="text-muted">Loading...</p></div>;
    }

    if (!exam) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">Exam not found.</div>
            </div>
        );
    }

    const questions = exam.questions || [];
    const mcQs = questions.filter(q => q.type === 'MULTIPLE_CHOICE');
    const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');
    const hasOpenEnded = oeQs.length > 0;

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Scores — {exam.title}</h5>
                    <button className="btn btn-light btn-sm" onClick={() => navigate('/teacher')}>
                        Back to Dashboard
                    </button>
                </div>
                <div className="card-body">
                    {hasOpenEnded ? (
                        <div className="alert alert-info py-2 mb-3 small">
                            This exam has <strong>{oeQs.length}</strong> open-ended question{oeQs.length > 1 ? 's' : ''}.
                            Grade is calculated across all <strong>{questions.length}</strong> questions (MC auto-scored + OE scored by you), each with equal weight.
                        </div>
                    ) : (
                        <div className="alert alert-secondary py-2 mb-3 small">
                            All questions are multiple choice — grades are auto-calculated. Use <strong>Grade</strong> to override if needed.
                        </div>
                    )}

                    {submissions.length === 0 ? (
                        <p className="text-muted">No submissions for this exam yet.</p>
                    ) : (
                        <table className="table table-bordered table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Student</th>
                                    <th>Grade</th>
                                    <th>Result</th>
                                    <th>Submitted</th>
                                    <th>Feedback</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(sub => {
                                    const student = users.find(u => u.id === sub.studentId);
                                    const passed = (sub.grade ?? 0) >= exam.passingGrade;
                                    const isGrading = gradingSubId === sub.id;

                                    const mcCorrectCount = mcQs.filter(q => sub.answers?.[q.id] === q.correctAnswer).length;
                                    const calculatedGrade = computeGrade(questions, sub.answers, oeScoresInput);

                                    return (
                                        <React.Fragment key={sub.id}>
                                            <tr>
                                                <td>{student ? `${student.name} (@${student.username})` : sub.studentId}</td>
                                                <td><strong>{sub.grade ?? '—'}%</strong></td>
                                                <td>
                                                    <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                                                        {passed ? 'Pass' : 'Fail'}
                                                    </span>
                                                    <br />
                                                    <small className={sub.resultsPublished ? 'text-success' : 'text-warning'}>
                                                        {sub.resultsPublished ? '● Published' : '● Pending'}
                                                    </small>
                                                </td>
                                                <td className="text-muted small">
                                                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                                                </td>
                                                <td className="small">
                                                    {sub.feedback
                                                        ? <span className="text-success">Given</span>
                                                        : <span className="text-muted fst-italic">None</span>}
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-1">
                                                        <button
                                                            className={`btn btn-sm ${isGrading ? 'btn-secondary' : 'btn-outline-primary'}`}
                                                            onClick={() => {
                                                                if (isGrading) setGradingSubId(null);
                                                                else openGrading(sub, questions);
                                                            }}
                                                        >
                                                            {isGrading ? 'Close' : 'Grade'}
                                                        </button>
                                                        <button
                                                            className={`btn btn-sm ${sub.resultsPublished ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                                                            onClick={() => handlePublish(sub)}
                                                        >
                                                            {sub.resultsPublished ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isGrading && (
                                                <tr className="table-warning">
                                                    <td colSpan={6}>
                                                        <div className="p-3">

                                                            {/* ── MC breakdown ── */}
                                                            {mcQs.length > 0 && (
                                                                <div className="mb-4">
                                                                    <h6 className="fw-semibold mb-2">
                                                                        Multiple Choice
                                                                        <span className="text-muted fw-normal ms-2 small">
                                                                            ({mcCorrectCount}/{mcQs.length} correct — auto-scored)
                                                                        </span>
                                                                    </h6>
                                                                    {mcQs.map(q => {
                                                                        const correct = sub.answers?.[q.id] === q.correctAnswer;
                                                                        return (
                                                                            <div key={q.id} className="d-flex align-items-start gap-2 mb-1 small">
                                                                                <span className={`fw-bold ${correct ? 'text-success' : 'text-danger'}`}>
                                                                                    {correct ? '✓' : '✗'}
                                                                                </span>
                                                                                <div>
                                                                                    <span>{q.text}</span>
                                                                                    {!correct && (
                                                                                        <span className="text-muted ms-2">
                                                                                            (answered: <em>{sub.answers?.[q.id] || '—'}</em> / correct: <em>{q.correctAnswer}</em>)
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* ── OE answers + per-question score inputs ── */}
                                                            {oeQs.length > 0 && (
                                                                <div className="mb-4">
                                                                    <h6 className="fw-semibold mb-2">Open-Ended Answers</h6>
                                                                    {oeQs.map(q => (
                                                                        <div key={q.id} className="mb-3">
                                                                            <p className="mb-1 fw-semibold small">Q: {q.text}</p>
                                                                            <div
                                                                                className="border rounded p-2 bg-white text-dark small mb-2"
                                                                                style={{ minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}
                                                                            >
                                                                                {sub.answers?.[q.id]
                                                                                    ? sub.answers[q.id]
                                                                                    : <span className="text-muted fst-italic">No answer provided</span>}
                                                                            </div>
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <label className="small fw-semibold mb-0">Score (0–100):</label>
                                                                                <input
                                                                                    type="number"
                                                                                    className="form-control form-control-sm"
                                                                                    style={{ width: '80px' }}
                                                                                    min={0} max={100}
                                                                                    value={oeScoresInput[q.id] ?? ''}
                                                                                    onChange={e => setOeScoresInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* ── Calculated grade ── */}
                                                            <div className={`alert py-2 mb-3 small ${useOverride ? 'alert-secondary' : 'alert-success'}`}>
                                                                {hasOpenEnded
                                                                    ? <>Calculated grade: <strong>{calculatedGrade}%</strong> <span className="text-muted">({questions.length} questions, equal weight)</span></>
                                                                    : <>Auto-graded score: <strong>{sub.grade ?? '—'}%</strong></>
                                                                }
                                                            </div>

                                                            {/* ── Override ── */}
                                                            <div className="mb-3">
                                                                <div className="form-check mb-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`override-${sub.id}`}
                                                                        checked={useOverride}
                                                                        onChange={e => setUseOverride(e.target.checked)}
                                                                    />
                                                                    <label className="form-check-label small fw-semibold" htmlFor={`override-${sub.id}`}>
                                                                        Override final grade manually
                                                                    </label>
                                                                </div>
                                                                {useOverride && (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <label className="small fw-semibold mb-0">Final Grade (0–100):</label>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm"
                                                                            style={{ width: '90px' }}
                                                                            min={0} max={100}
                                                                            value={overrideInput}
                                                                            onChange={e => setOverrideInput(e.target.value)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* ── Feedback ── */}
                                                            <div className="mb-3">
                                                                <label className="fw-semibold small mb-1">Written Feedback (visible to student):</label>
                                                                <textarea
                                                                    className="form-control form-control-sm"
                                                                    rows={3}
                                                                    placeholder="Leave feedback for the student..."
                                                                    value={feedbackInput}
                                                                    onChange={e => setFeedbackInput(e.target.value)}
                                                                />
                                                            </div>

                                                            <div className="d-flex gap-2">
                                                                <button className="btn btn-success btn-sm" onClick={() => handleSaveGrade(sub)}>
                                                                    Save Grade
                                                                </button>
                                                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setGradingSubId(null)}>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamScoresPage;
