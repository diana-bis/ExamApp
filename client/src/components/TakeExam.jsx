import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';
import ExamForm from './ExamForm';

const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const answersRef = useRef({});
    const intervalRef = useRef(null);

    // Keep ref in sync so the timer's auto-submit always sees the latest answers
    useEffect(() => { answersRef.current = answers; }, [answers]);

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

    // Start countdown once exam data arrives
    useEffect(() => {
        if (!exam) return;
        const seconds = exam.timeLimit * 60;
        setTimeLeft(seconds);

        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [exam?.id]);

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeLeft === 0 && !result && !submitting) {
            notifyService.notifyError('Time is up! Your answers have been submitted automatically.');
            loggerService.log('TakeExam: time expired — auto-submitting');
            doSubmit(answersRef.current);
        }
    }, [timeLeft]);

    // ── Submission logic ───────────────────────────────────────────────────────

    const doSubmit = async (currentAnswers) => {
        clearInterval(intervalRef.current);
        setSubmitting(true);
        loggerService.log(`TakeExam: submitting answers for exam "${examId}"`);

        try {
            const mcQuestions = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE');
            const details = exam.questions.map(q => {
                if (q.type === 'MULTIPLE_CHOICE') {
                    const correct = currentAnswers[q.id] === q.correctAnswer;
                    return { ...q, selected: currentAnswers[q.id], correct };
                }
                return { ...q, selected: currentAnswers[q.id] ?? '', correct: null };
            });

            const mcTotal = mcQuestions.length;
            const mcCorrect = details.filter(d => d.type === 'MULTIPLE_CHOICE' && d.correct).length;
            const grade = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0;

            const hasOE = exam.questions.some(q => q.type === 'OPEN_ENDED');
            await submissionService.submitExam({
                studentId: currentUser?.id,
                examId,
                answers: currentAnswers,
                grade,
                resultsPublished: !hasOE,
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

    const handleSubmit = () => {
        const unansweredMC = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE' && !answers[q.id]);
        if (unansweredMC.length > 0) {
            notifyService.notifyError(`Please answer all multiple choice questions. (${unansweredMC.length} remaining)`);
            return;
        }
        doSubmit(answers);
    };

    const handleSelectMC = (questionId, option) =>
        setAnswers(prev => ({ ...prev, [questionId]: option }));

    const handleOpenEnded = (questionId, text) =>
        setAnswers(prev => ({ ...prev, [questionId]: text }));

    // ── Views ──────────────────────────────────────────────────────────────────

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
                                                Your answer: <strong>{q.selected || '—'}</strong>
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
    const timerBadge = timeLeft <= 30
        ? 'bg-danger'
        : timeLeft <= 60
            ? 'bg-warning text-dark'
            : 'bg-light text-dark';

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{exam.title}</h5>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark">
                            {mcAnswered} / {mcTotal} answered
                        </span>
                        {timeLeft !== null && (
                            <span className={`badge ${timerBadge}`} style={{ fontSize: '0.95rem', minWidth: 60 }}>
                                ⏱ {formatTime(timeLeft)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    <ExamForm
                        questions={exam.questions}
                        answers={answers}
                        onSelectMC={handleSelectMC}
                        onOpenEnded={handleOpenEnded}
                        onSubmit={handleSubmit}
                        onCancel={() => navigate('/student')}
                        submitting={submitting}
                    />
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
