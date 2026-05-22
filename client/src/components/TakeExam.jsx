import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        loggerService.log(`TakeExam: loading exam "${examId}"`);
        examService.getExamById(examId)
            .then(data => {
                setExam(data);
                loggerService.log(`TakeExam: exam loaded — "${data.title}"`);
            })
            .catch(err => {
                loggerService.error('TakeExam: load failed:', err.message);
                notifyService.notifyError('Could not load exam. Please go back and try again.');
            })
            .finally(() => setLoading(false));
    }, [examId]);

    const handleSelectMC = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleOpenEnded = (questionId, text) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleSubmit = async () => {
        const mcQuestions = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE');
        const unansweredMC = mcQuestions.filter(q => !answers[q.id]);
        if (unansweredMC.length > 0) {
            notifyService.notifyError(`Please answer all multiple choice questions. (${unansweredMC.length} remaining)`);
            return;
        }

        setSubmitting(true);
        loggerService.log(`TakeExam: submitting answers for exam "${examId}"`);

        try {
            const details = exam.questions.map(q => {
                if (q.type === 'MULTIPLE_CHOICE') {
                    const correct = answers[q.id] === q.correctAnswer;
                    return { ...q, selected: answers[q.id], correct };
                }
                return { ...q, selected: answers[q.id] ?? '', correct: null };
            });

            const mcTotal = mcQuestions.length;
            const mcCorrect = details.filter(d => d.type === 'MULTIPLE_CHOICE' && d.correct).length;
            const grade = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0;

            await submissionService.submitExam({
                studentId: currentUser?.id,
                examId,
                answers,
                grade,
            });

            loggerService.log(`TakeExam: submission complete — grade ${grade}%`);
            notifyService.notifySuccess(`Submitted! You scored ${mcCorrect}/${mcTotal} (${grade}%).`);
            setResult({ grade, mcCorrect, mcTotal, details, passingGrade: exam.passingGrade });
        } catch (err) {
            loggerService.error('TakeExam: submission failed:', err.message);
            notifyService.notifyError('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="card shadow">
                    <div className="card-body text-center py-5 text-muted">Loading exam...</div>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="container mt-4">
                <div className="card shadow">
                    <div className="card-body text-center py-5">
                        <p className="text-danger mb-3">Exam could not be loaded.</p>
                        <button className="btn btn-outline-secondary" onClick={() => navigate('/student')}>
                            Back to Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        const passed = result.grade >= result.passingGrade;
        return (
            <div className="container mt-4">
                <div className="card shadow">
                    <div className={`card-header text-white ${passed ? 'bg-success' : 'bg-danger'}`}>
                        <h3 className="mb-0">Results — {exam.title}</h3>
                    </div>
                    <div className="card-body">
                        <div className="mb-4">
                            <h4 className="mb-1">
                                Score: {result.mcCorrect} / {result.mcTotal} &nbsp;
                                <span className="fs-5 text-muted">({result.grade}%)</span>
                            </h4>
                            <span className={`badge ${passed ? 'bg-success' : 'bg-danger'} fs-6`}>
                                {passed ? 'Passed' : 'Failed'} &nbsp;(Passing Grade: {result.passingGrade}%)
                            </span>
                        </div>

                        <div className="list-group mb-4">
                            {result.details.map((q, i) => {
                                const isOpen = q.type === 'OPEN_ENDED';
                                const itemClass = isOpen
                                    ? 'list-group-item list-group-item-secondary'
                                    : `list-group-item ${q.correct ? 'list-group-item-success' : 'list-group-item-danger'}`;

                                return (
                                    <div key={q.id} className={itemClass}>
                                        <div className="d-flex justify-content-between">
                                            <span><strong>Q{i + 1}:</strong> {q.text}</span>
                                            {!isOpen && <span>{q.correct ? '✓' : '✗'}</span>}
                                            {isOpen && <span className="badge bg-secondary">Pending review</span>}
                                        </div>
                                        {!isOpen && (
                                            <small>
                                                Your answer: <strong>{q.selected}</strong>
                                                {!q.correct && <> &nbsp;|&nbsp; Correct: <strong>{q.correctAnswer}</strong></>}
                                            </small>
                                        )}
                                        {isOpen && q.selected && (
                                            <small className="text-muted">Your answer: {q.selected}</small>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button className="btn btn-outline-secondary" onClick={() => navigate('/student')}>
                            Back to Portal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const mcAnswered = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE' && answers[q.id]).length;
    const mcTotal = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE').length;

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">{exam.title}</h3>
                    <span className="badge bg-light text-dark">
                        {mcAnswered} / {mcTotal} answered
                    </span>
                </div>
                <div className="card-body">
                    {exam.questions.map((q, index) => (
                        <div key={q.id} className="mb-4 p-3 border rounded">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <p className="fw-semibold mb-0">
                                    {index + 1}. {q.text}
                                </p>
                                <span className={`badge ms-2 ${q.type === 'MULTIPLE_CHOICE' ? 'bg-primary' : 'bg-secondary'}`}>
                                    {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                                </span>
                            </div>

                            {q.type === 'MULTIPLE_CHOICE' && (
                                <div className="d-flex flex-column gap-2 mt-2">
                                    {q.options.map((option, optIndex) => (
                                        <div key={optIndex} className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`question-${q.id}`}
                                                id={`q${q.id}-opt${optIndex}`}
                                                value={option}
                                                checked={answers[q.id] === option}
                                                onChange={() => handleSelectMC(q.id, option)}
                                            />
                                            <label className="form-check-label" htmlFor={`q${q.id}-opt${optIndex}`}>
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {q.type === 'OPEN_ENDED' && (
                                <textarea
                                    className="form-control mt-2"
                                    rows={4}
                                    placeholder="Write your answer here..."
                                    value={answers[q.id] ?? ''}
                                    onChange={(e) => handleOpenEnded(q.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <button className="btn btn-outline-secondary" onClick={() => navigate('/student')}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Exam'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
