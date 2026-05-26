import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const HEADER_GRADIENT = 'linear-gradient(135deg, #1a237e 0%, #4527a0 50%, #6a1b9a 100%)';
const PURPLE_ACTIVE   = 'linear-gradient(135deg, #4527a0, #6a1b9a)';

/*
 * Computes final grade for submission.
 *
 * Logic:
 *   - MC questions:
 *       correct = 100
 *       incorrect = 0
 *
 *   - Open-ended:
 *       teacher manually enters score
 *
 * Final grade:
 *   average of all question scores
 */

const computeGrade = (questions, answers, oeScoresInput) => {
    const totalQ = questions.length;
    // avoid division by zero
    if (totalQ === 0) return 0;
    // compute score for each question, then average
    const scores = questions.map(q => {
        // MULTIPLE CHOICE
        if (q.type === 'MULTIPLE_CHOICE') {
            return answers?.[q.id] === q.correctAnswer ? 100 : 0;
        }
        // OPEN-ENDED
        return Math.min(100, Math.max(0, Number(oeScoresInput[q.id]) || 0));
    });
    // average and round to nearest integer
    return Math.round(scores.reduce((a, b) => a + b, 0) / totalQ);
};

/*
 * ExamScoresPage
 *
 * Teacher grading page.
 *
 * Responsibilities:
 *   - show all submissions for exam
 *   - calculate grades
 *   - manual grading for open-ended questions
 *   - publish/unpublish results
 *   - save teacher feedback
 */

const ExamScoresPage = () => {
    // get examId from URL params and navigate function for redirection
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // detemines which submission is currently being graded
    const [gradingSubId, setGradingSubId] = useState(null);
    // Stores open-ended question scores
    const [oeScoresInput, setOeScoresInput] = useState({});
    // override state allows teacher to ignore calculated grade and enter a custom grade instead
    const [useOverride, setUseOverride] = useState(false);
    // overrideInput stores the custom grade value when useOverride is true
    const [overrideInput, setOverrideInput] = useState('');
    // teacher feedback input
    const [feedbackInput, setFeedbackInput] = useState('');

    useEffect(() => {
        Promise.all([
            // load exam details
            examService.getExamById(examId),
            // load submissions for exam
            submissionService.getSubmissionsByExam(examId),
            // load all users to match student names in submission list
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

    // Opens grading panel for selected submission
    const openGrading = (sub, questions) => {
        // get only open-ended questions
        const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');
        setGradingSubId(sub.id);
        // preload existing open-ended scores
        setOeScoresInput(
            Object.fromEntries(oeQs.map(q => [q.id, String(sub.oeScores?.[q.id] ?? '')]))
        );
        setUseOverride(false);
        setOverrideInput(String(sub.grade ?? ''));
        setFeedbackInput(sub.feedback ?? '');
    };

    // Publish/unpublish results to student
    const handlePublish = async (sub) => {
        const resultsPublished = !sub.resultsPublished;
        await submissionService.updateSubmission(sub.id, { resultsPublished });
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, resultsPublished } : s));
        notifyService.notifySuccess(resultsPublished ? 'Results published to student.' : 'Results unpublished.');
        loggerService.log('ExamScoresPage › publish toggle:', sub.id, '→', resultsPublished);
    };

    // Save grade and feedback
    const handleSaveGrade = async (sub) => {
        const questions = exam.questions || [];
        const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');

        const oeScoresNumeric = Object.fromEntries(
            oeQs.map(q => [q.id, Math.min(100, Math.max(0, Number(oeScoresInput[q.id]) || 0))])
        );

        let grade;
        // manual override mode
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
        // update submission with new grade, feedback, and open-ended scores
        await submissionService.updateSubmission(sub.id, { grade, feedback, oeScores: oeScoresNumeric });
        setSubmissions(prev =>
            prev.map(s => s.id === sub.id ? { ...s, grade, feedback, oeScores: oeScoresNumeric } : s)
        );
        notifyService.notifySuccess('Grade and feedback saved.');
        loggerService.log('ExamScoresPage › graded submission:', sub.id, 'grade:', grade);
        setGradingSubId(null);
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border" style={{ color: '#6a1b9a' }}></div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="container mt-4" style={{ maxWidth: 480 }}>
                <div className="card border-0 shadow-sm text-center p-5">
                    <i className="bi bi-exclamation-circle text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-danger fw-semibold">Exam not found.</p>
                </div>
            </div>
        );
    }

    // separate multiple choice and open-ended questions for grading display
    const questions = exam.questions || [];
    const mcQs = questions.filter(q => q.type === 'MULTIPLE_CHOICE');
    const oeQs = questions.filter(q => q.type === 'OPEN_ENDED');
    const hasOpenEnded = oeQs.length > 0;

    return (
        <div className="container mt-4 mb-5">
            <style>{`
              .sub-row { transition: background 0.12s ease; }
              .sub-row:hover td { background: #f8f5ff !important; }
            `}</style>

            <div className="card shadow-lg border-0 overflow-hidden">

                {/* Header */}
                <div className="py-3 px-4 text-white d-flex justify-content-between align-items-center"
                    style={{ background: HEADER_GRADIENT }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
                            style={{ width: 44, height: 44, flexShrink: 0 }}>
                            <i className="bi bi-bar-chart-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold">Submissions</h5>
                            <small className="opacity-75">{exam.title}</small>
                        </div>
                    </div>
                    <button className="btn btn-sm bg-white bg-opacity-25 text-white border-0"
                        style={{ borderRadius: 8 }}
                        onClick={() => navigate('/teacher')}>
                        <i className="bi bi-arrow-left me-1"></i>Dashboard
                    </button>
                </div>

                <div className="p-4" style={{ background: '#fdfaff' }}>

                    {/* Info banner */}
                    {hasOpenEnded ? (
                        <div className="rounded-3 px-3 py-2 mb-4 small d-flex align-items-center gap-2"
                            style={{ background: '#ede7f6', border: '1px solid #ce93d8', color: '#4527a0' }}>
                            <i className="bi bi-info-circle-fill"></i>
                            This exam has <strong>{oeQs.length}</strong> open-ended question{oeQs.length > 1 ? 's' : ''}.
                            Grade is calculated across all <strong>{questions.length}</strong> questions with equal weight.
                        </div>
                    ) : (
                        <div className="rounded-3 px-3 py-2 mb-4 small d-flex align-items-center gap-2"
                            style={{ background: '#f3e5f5', border: '1px solid #ce93d8', color: '#6a1b9a' }}>
                            <i className="bi bi-check-circle-fill"></i>
                            All questions are multiple choice — grades are auto-calculated. Use <strong>Grade</strong> to override if needed.
                        </div>
                    )}

                    {submissions.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
                            <p className="mt-2">No submissions for this exam yet.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table align-middle" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                                <thead>
                                    <tr style={{ background: '#f3e5f5' }}>
                                        {['Student', 'Grade', 'Result', 'Submitted', 'Feedback', 'Actions'].map(h => (
                                            <th key={h} className="py-2 px-3"
                                                style={{ color: '#4527a0', borderBottom: '2px solid #ce93d8', fontWeight: 600 }}>
                                                {h}
                                            </th>
                                        ))}
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
                                                <tr className="sub-row">
                                                    <td className="px-3 small fw-semibold">
                                                        {student ? `${student.name} (@${student.username})` : sub.studentId}
                                                    </td>
                                                    <td className="px-3">
                                                        <strong style={{ color: passed ? '#2e7d32' : '#c62828' }}>
                                                            {sub.grade ?? '—'}%
                                                        </strong>
                                                    </td>
                                                    <td className="px-3">
                                                        <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                                                            {passed ? 'Pass' : 'Fail'}
                                                        </span>
                                                        <br />
                                                        <small className={sub.resultsPublished ? 'text-success' : 'text-warning'}>
                                                            {sub.resultsPublished ? '● Published' : '● Pending'}
                                                        </small>
                                                    </td>
                                                    <td className="px-3 text-muted small">
                                                        {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="px-3 small">
                                                        {sub.feedback
                                                            ? <span className="text-success"><i className="bi bi-chat-left-text me-1"></i>Given</span>
                                                            : <span className="text-muted fst-italic">None</span>}
                                                    </td>
                                                    <td className="px-3">
                                                        <div className="d-flex flex-column gap-1">
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{
                                                                    background: isGrading ? '#e0e0e0' : PURPLE_ACTIVE,
                                                                    color: isGrading ? '#555' : '#fff',
                                                                    border: 'none', borderRadius: 6,
                                                                }}
                                                                onClick={() => {
                                                                    if (isGrading) setGradingSubId(null);
                                                                    else openGrading(sub, questions);
                                                                }}
                                                            >
                                                                {isGrading ? 'Close' : 'Grade'}
                                                            </button>
                                                            <button
                                                                className={`btn btn-sm ${sub.resultsPublished ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                                                                style={{ borderRadius: 6 }}
                                                                onClick={() => handlePublish(sub)}
                                                            >
                                                                {sub.resultsPublished ? 'Unpublish' : 'Publish'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* ── Grading panel ── */}
                                                {isGrading && (
                                                    <tr>
                                                        <td colSpan={6} className="p-0">
                                                            <div className="p-4" style={{ background: '#f8f5ff', borderTop: '2px solid #ce93d8', borderBottom: '2px solid #ce93d8' }}>

                                                                {/* ── MC breakdown ── */}
                                                                {mcQs.length > 0 && (
                                                                    <div className="mb-4">
                                                                        <h6 className="fw-semibold mb-2" style={{ color: '#4527a0' }}>
                                                                            Multiple Choice
                                                                            <span className="text-muted fw-normal ms-2 small">
                                                                                ({mcCorrectCount}/{mcQs.length} correct — auto-scored)
                                                                            </span>
                                                                        </h6>
                                                                        <div className="d-flex flex-column gap-1">
                                                                            {mcQs.map(q => {
                                                                                const correct = sub.answers?.[q.id] === q.correctAnswer;
                                                                                return (
                                                                                    <div key={q.id} className="d-flex align-items-start gap-2 small rounded-3 px-3 py-2 bg-white shadow-sm"
                                                                                        style={{ borderLeft: `3px solid ${correct ? '#28a745' : '#dc3545'}` }}>
                                                                                        <span className={`fw-bold ${correct ? 'text-success' : 'text-danger'}`}>
                                                                                            {correct ? '✓' : '✗'}
                                                                                        </span>
                                                                                        <div>
                                                                                            <span>{q.text}</span>
                                                                                            {!correct && (
                                                                                                <span className="text-muted ms-2">
                                                                                                    (answered: <em>{sub.answers?.[q.id] || '—'}</em> · correct: <em className="text-success">{q.correctAnswer}</em>)
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* ── OE answers + per-question score inputs ── */}
                                                                {oeQs.length > 0 && (
                                                                    <div className="mb-4">
                                                                        <h6 className="fw-semibold mb-2" style={{ color: '#4527a0' }}>Open-Ended Answers</h6>
                                                                        {oeQs.map(q => (
                                                                            <div key={q.id} className="mb-3 rounded-3 bg-white shadow-sm p-3"
                                                                                style={{ border: '1px solid #e8d5f5' }}>
                                                                                <p className="mb-2 fw-semibold small" style={{ color: '#6a1b9a' }}>Q: {q.text}</p>
                                                                                <div className="rounded-3 p-2 small mb-2"
                                                                                    style={{ background: '#fdfaff', border: '1px solid #d1c4e9', minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}>
                                                                                    {sub.answers?.[q.id]
                                                                                        ? sub.answers[q.id]
                                                                                        : <span className="text-muted fst-italic">No answer provided</span>}
                                                                                </div>
                                                                                <div className="d-flex align-items-center gap-2">
                                                                                    <label className="small fw-semibold mb-0" style={{ color: '#4527a0' }}>Score (0–100):</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        className="form-control form-control-sm"
                                                                                        style={{ width: '80px', background: '#f8f5ff', border: '1px solid #d1c4e9' }}
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
                                                                <div className="rounded-3 px-3 py-2 mb-3 small d-flex align-items-center gap-2"
                                                                    style={{ background: useOverride ? '#f5f5f5' : '#e8f5e9', border: `1px solid ${useOverride ? '#e0e0e0' : '#a5d6a7'}`, color: useOverride ? '#757575' : '#2e7d32' }}>
                                                                    <i className={`bi ${useOverride ? 'bi-dash-circle' : 'bi-calculator'}`}></i>
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
                                                                            style={{ accentColor: '#6a1b9a' }}
                                                                        />
                                                                        <label className="form-check-label small fw-semibold" htmlFor={`override-${sub.id}`}
                                                                            style={{ color: '#4527a0' }}>
                                                                            Override final grade manually
                                                                        </label>
                                                                    </div>
                                                                    {useOverride && (
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <label className="small fw-semibold mb-0" style={{ color: '#4527a0' }}>Final Grade (0–100):</label>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                style={{ width: '90px', background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                                                                                min={0} max={100}
                                                                                value={overrideInput}
                                                                                onChange={e => setOverrideInput(e.target.value)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* ── Feedback ── */}
                                                                <div className="mb-3">
                                                                    <label className="fw-semibold small mb-1" style={{ color: '#4527a0' }}>
                                                                        <i className="bi bi-chat-left-quote me-1"></i>Written Feedback (visible to student):
                                                                    </label>
                                                                    <textarea
                                                                        className="form-control form-control-sm"
                                                                        rows={3}
                                                                        placeholder="Leave feedback for the student..."
                                                                        value={feedbackInput}
                                                                        onChange={e => setFeedbackInput(e.target.value)}
                                                                        style={{ background: '#fdfaff', border: '1px solid #d1c4e9' }}
                                                                    />
                                                                </div>

                                                                <div className="d-flex gap-2">
                                                                    <button className="btn btn-sm text-white fw-semibold"
                                                                        style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)', border: 'none', borderRadius: 7 }}
                                                                        onClick={() => handleSaveGrade(sub)}>
                                                                        <i className="bi bi-floppy me-1"></i>Save Grade
                                                                    </button>
                                                                    <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 7 }}
                                                                        onClick={() => setGradingSubId(null)}>
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamScoresPage;
