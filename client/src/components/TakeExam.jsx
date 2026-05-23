import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';
import ExamForm from './ExamForm';

// Convert seconds into MM:SS format
const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

/*
 * TakeExam
 *
 * Responsibilities:
 *   - load exam
 *   - display questions
 *   - store student answers
 *   - manage countdown timer
 *   - auto-submit when time expires
 *   - calculate MC grade
 *   - submit answers
 *   - display results
 */

const TakeExam = () => {
    // get exam id from URL, and current user from auth service
    const { examId } = useParams();
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();

    // loaded exam object
    const [exam, setExam] = useState(null);
    // loading state for fetching exam
    const [loading, setLoading] = useState(true);
    // student's selected answers, stored as { questionId: answer }
    const [answers, setAnswers] = useState({});
    // submission state to prevent multiple submits
    const [submitting, setSubmitting] = useState(false);
    // final result object after submission
    const [result, setResult] = useState(null);
    // time left in seconds for countdown timer
    const [timeLeft, setTimeLeft] = useState(null);

    // answersRef stores latest answers
    const answersRef = useRef({});
    // intervalRef stores timer interval id
    const intervalRef = useRef(null);

    // Keep ref in sync so the timer's auto-submit always sees the latest answers
    useEffect(() => { answersRef.current = answers; }, [answers]);

    // Load exam details when page opens
    useEffect(() => {
        loggerService.log(`TakeExam: loading exam "${examId}"`);
        examService.getExamById(examId)
            .then(data => {
                // store exam
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
        // no exam yet
        if (!exam) return;
        const seconds = exam.timeLimit * 60;
        setTimeLeft(seconds);

        // create interval that ticks every second and decreases time left
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

    // Submit exam answers to backend, then calculate and display results
    const doSubmit = async (currentAnswers) => {
        // stop timer
        clearInterval(intervalRef.current);
        // start submitting state
        setSubmitting(true);
        loggerService.log(`TakeExam: submitting answers for exam "${examId}"`);

        try {
            // calculate grade for multiple choice questions
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

            // detect open-ended questions - if any exist, results cannot be published until teacher reviews them, set resultsPublished to false
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
            // show results screen with MC grading - if open-ended questions exist, show "pending review" instead of pass/fail
            setResult({ grade, mcCorrect, mcTotal, details, passingGrade: exam.passingGrade });
        } catch (err) {
            loggerService.error('TakeExam: submission failed:', err.message);
            notifyService.notifyError('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    //  validate before submission
    const handleSubmit = () => {
        // require all MC questions answered
        const unansweredMC = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE' && !answers[q.id]);
        if (unansweredMC.length > 0) {
            notifyService.notifyError(`Please answer all multiple choice questions. (${unansweredMC.length} remaining)`);
            return;
        }
        doSubmit(answers);
    };

    // handle answer selection for multiple choice questions
    const handleSelectMC = (questionId, option) =>
        setAnswers(prev => ({ ...prev, [questionId]: option }));

    // handle text input for open-ended questions
    const handleOpenEnded = (questionId, text) =>
        setAnswers(prev => ({ ...prev, [questionId]: text }));

    // ── Views ──────────────────────────────────────────────────────────────────

    // loading state
    if (loading) {
        return (
            <div className="container mt-4">
                <div className="card shadow">
                    <div className="card-body text-center py-5 text-muted">Loading exam...</div>
                </div>
            </div>
        );
    }

    // if exam failed to load, show error message
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

    // Show results screen after submission
    if (result) {
        // determine pass/fail based on grade and passing grade 
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

    // show exam form with questions and countdown timer
    // count answered multiple choice questions
    const mcAnswered = exam.questions.filter(q => q.type === 'MULTIPLE_CHOICE' && answers[q.id]).length;
    // total multiple choice questions
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
                        // exam questions
                        questions={exam.questions}
                        // current student answers
                        answers={answers}
                        //  MC answer handler
                        onSelectMC={handleSelectMC}
                        // OE answer handler
                        onOpenEnded={handleOpenEnded}
                        // submit handler
                        onSubmit={handleSubmit}
                        // cancel exam
                        onCancel={() => navigate('/student')}
                        // loading state
                        submitting={submitting}
                    />
                </div>
            </div>
        </div>
    );
};

export default TakeExam;
