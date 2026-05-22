import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const ExamScoresPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingSubId, setGradingSubId] = useState(null);
    const [gradeInput, setGradeInput] = useState('');

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

    const handleSaveGrade = async (sub) => {
        const grade = Number(gradeInput);
        if (isNaN(grade) || grade < 0 || grade > 100) {
            notifyService.notifyError('Grade must be between 0 and 100.');
            return;
        }
        await submissionService.updateSubmission(sub.id, { grade });
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, grade } : s));
        notifyService.notifySuccess('Grade saved.');
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

    const openEndedQs = (exam.questions || []).filter(q => q.type === 'OPEN_ENDED');
    const hasOpenEnded = openEndedQs.length > 0;

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
                            This exam has <strong>{openEndedQs.length}</strong> open-ended question{openEndedQs.length > 1 ? 's' : ''}.
                            Use the <strong>Grade</strong> button to review answers and set a final score.
                        </div>
                    ) : (
                        <div className="alert alert-secondary py-2 mb-3 small">
                            All questions are multiple choice — grades are auto-calculated. Use <strong>Grade</strong> to override a score if needed.
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
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(sub => {
                                    const student = users.find(u => u.id === sub.studentId);
                                    const passed = (sub.grade ?? 0) >= exam.passingGrade;
                                    const isGrading = gradingSubId === sub.id;
                                    return (
                                        <React.Fragment key={sub.id}>
                                            <tr>
                                                <td>{student ? `${student.name} (@${student.username})` : sub.studentId}</td>
                                                <td><strong>{sub.grade ?? '—'}%</strong></td>
                                                <td>
                                                    <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                                                        {passed ? 'Pass' : 'Fail'}
                                                    </span>
                                                </td>
                                                <td className="text-muted small">
                                                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                                                </td>
                                                <td>
                                                    <button
                                                        className={`btn btn-sm ${isGrading ? 'btn-secondary' : 'btn-outline-primary'}`}
                                                        onClick={() => {
                                                            if (isGrading) {
                                                                setGradingSubId(null);
                                                            } else {
                                                                setGradingSubId(sub.id);
                                                                setGradeInput(String(sub.grade ?? ''));
                                                            }
                                                        }}
                                                    >
                                                        {isGrading ? 'Close' : 'Grade'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isGrading && (
                                                <tr className="table-warning">
                                                    <td colSpan={5}>
                                                        <div className="p-2">
                                                            {hasOpenEnded ? (
                                                                <h6 className="fw-semibold mb-3">Open-Ended Answers</h6>
                                                            ) : (
                                                                <p className="small text-muted mb-3">
                                                                    Auto-graded score: <strong>{sub.grade ?? '—'}%</strong>. You can override it below.
                                                                </p>
                                                            )}
                                                            {openEndedQs.map(q => (
                                                                <div key={q.id} className="mb-3">
                                                                    <p className="mb-1 fw-semibold small">Q: {q.text}</p>
                                                                    <div
                                                                        className="border rounded p-2 bg-white text-dark small"
                                                                        style={{ minHeight: '2.5rem', whiteSpace: 'pre-wrap' }}
                                                                    >
                                                                        {sub.answers?.[q.id]
                                                                            ? sub.answers[q.id]
                                                                            : <span className="text-muted fst-italic">No answer provided</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="d-flex align-items-center gap-3 mt-2">
                                                                <label className="fw-semibold small mb-0">Final Grade (0–100):</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm"
                                                                    style={{ width: '90px' }}
                                                                    min={0}
                                                                    max={100}
                                                                    value={gradeInput}
                                                                    onChange={e => setGradeInput(e.target.value)}
                                                                />
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
