import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { authService } from '../services/AuthService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';
import ExamForm from './ExamForm';

const HEADER_GRADIENT = 'linear-gradient(135deg, #1a237e 0%, #0288d1 60%, #00bcd4 100%)';

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
            setResult({ grade, mcCorrect, mcTotal, details, passingGrade: exam.passingGrade, hasOE });
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
            <div className="container mt-5 text-center">
                <div className="d-inline-flex flex-column align-items-center gap-3">
                    <div className="spinner-border text-primary" style={{ width: 48, height: 48 }}></div>
                    <p className="text-muted">Loading exam...</p>
                </div>
            </div>
        );
    }

    // if exam failed to load, show error message
    if (!exam) {
        return (
            <div className="container mt-4" style={{ maxWidth: 480 }}>
                <div className="card shadow-sm border-0 text-center p-5">
                    <i className="bi bi-exclamation-circle text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-danger fw-semibold mb-3">Exam could not be loaded.</p>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/student')}>
                        <i className="bi bi-arrow-left me-2"></i>Back to Portal
                    </button>
                </div>
            </div>
        );
    }

    // Show results screen after submission
    if (result) {
        // determine pass/fail based on grade and passing grade
        const passed = result.grade >= result.passingGrade;
        const gradeColor = result.hasOE && result.mcTotal === 0
            ? '#607d8b'
            : passed ? '#2e7d32' : '#c62828';
        const gradeGradient = result.hasOE && result.mcTotal === 0
            ? 'linear-gradient(135deg, #546e7a, #78909c)'
            : passed
                ? 'linear-gradient(135deg, #2e7d32, #43a047)'
                : 'linear-gradient(135deg, #c62828, #e53935)';

        return (
            <div className="container mt-4 mb-5">
                <style>{`
                  @keyframes popIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to   { opacity: 1; transform: scale(1); }
                  }
                  .grade-circle { animation: popIn 0.4s ease forwards; }
                  .result-item { transition: transform 0.15s ease; }
                  .result-item:hover { transform: translateX(3px); }
                `}</style>

                <div className="card shadow-lg border-0 overflow-hidden" style={{ maxWidth: 680, margin: '0 auto' }}>

                    {/* Header */}
                    <div className="py-3 px-4 text-white" style={{ background: HEADER_GRADIENT }}>
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-mortarboard-fill" style={{ fontSize: '1.3rem' }}></i>
                            <h5 className="mb-0 fw-bold">{exam.title}</h5>
                        </div>
                    </div>

                    <div className="p-4" style={{ background: '#fafcff' }}>

                        {/* Grade circle */}
                        <div className="text-center mb-4">
                            <div className="grade-circle d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow"
                                style={{ width: 120, height: 120, background: gradeGradient }}>
                                <div className="text-white text-center">
                                    {result.hasOE && result.mcTotal === 0
                                        ? <i className="bi bi-hourglass-split" style={{ fontSize: '2.2rem' }}></i>
                                        : <>
                                            <div className="fw-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>{result.grade}%</div>
                                            <div className="small opacity-75">grade</div>
                                        </>
                                    }
                                </div>
                            </div>

                            {result.hasOE && result.mcTotal === 0 ? (
                                <div>
                                    <span className="badge bg-warning text-dark fs-6">
                                        <i className="bi bi-hourglass-split me-1"></i>Pending teacher review
                                    </span>
                                    <p className="text-muted small mt-2">Your open-ended answers will be graded by your teacher.</p>
                                </div>
                            ) : (
                                <div>
                                    <span className="badge fs-6" style={{ background: gradeGradient }}>
                                        {passed
                                            ? <><i className="bi bi-trophy-fill me-1"></i>Passed</>
                                            : <><i className="bi bi-x-circle-fill me-1"></i>Failed</>}
                                    </span>
                                    <p className="text-muted small mt-2">
                                        {result.mcCorrect}/{result.mcTotal} correct &nbsp;·&nbsp; Passing grade: {result.passingGrade}%
                                        {result.hasOE && <span className="ms-1">&nbsp;·&nbsp; Open-ended answers pending review</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Per-question breakdown */}
                        <div className="d-flex flex-column gap-2 mb-4">
                            {result.details.map((q, i) => {
                                const isOpen = q.type === 'OPEN_ENDED';
                                const borderColor = isOpen ? '#9e9e9e' : q.correct ? '#28a745' : '#dc3545';
                                return (
                                    <div key={q.id} className="result-item rounded-3 px-3 py-2 bg-white shadow-sm"
                                        style={{ borderLeft: `4px solid ${borderColor}` }}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <span className="fw-semibold small">Q{i + 1}: {q.text}</span>
                                            {isOpen
                                                ? <span className="badge bg-secondary ms-2 flex-shrink-0">Pending review</span>
                                                : <span className={`badge ms-2 flex-shrink-0 ${q.correct ? 'bg-success' : 'bg-danger'}`}>
                                                    {q.correct ? '✓ Correct' : '✗ Wrong'}
                                                  </span>}
                                        </div>
                                        {!isOpen && (
                                            <small className="text-muted">
                                                Your answer: <strong>{q.selected || '—'}</strong>
                                                {!q.correct && <> &nbsp;·&nbsp; Correct: <strong className="text-success">{q.correctAnswer}</strong></>}
                                            </small>
                                        )}
                                        {isOpen && q.selected && (
                                            <small className="text-muted">Your answer: {q.selected}</small>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn text-white fw-semibold px-4"
                            style={{ background: HEADER_GRADIENT, border: 'none', borderRadius: 8 }}
                            onClick={() => navigate('/student')}
                        >
                            <i className="bi bi-house-fill me-2"></i>Back to Portal
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

    // timer colour changes as time runs low
    const timerUrgent  = timeLeft !== null && timeLeft <= 30;
    const timerWarning = timeLeft !== null && timeLeft > 30 && timeLeft <= 60;
    const timerColor   = timerUrgent ? '#c62828' : timerWarning ? '#e65100' : '#fff';
    const timerBg      = timerUrgent ? 'rgba(198,40,40,0.2)' : timerWarning ? 'rgba(230,81,0,0.15)' : 'rgba(255,255,255,0.15)';

    // progress through MC questions
    const progress = mcTotal > 0 ? Math.round((mcAnswered / mcTotal) * 100) : 100;

    return (
        <div className="container mt-4 mb-5">
            <style>{`
              @keyframes timerPulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.5; }
              }
              .timer-urgent { animation: timerPulse 0.7s ease infinite; }
            `}</style>

            <div className="card shadow-lg border-0 overflow-hidden">

                {/* Header */}
                <div className="py-3 px-4 text-white" style={{ background: HEADER_GRADIENT }}>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-journal-text" style={{ fontSize: '1.2rem' }}></i>
                            <h5 className="mb-0 fw-bold">{exam.title}</h5>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {/* MC progress badge */}
                            {mcTotal > 0 && (
                                <span className="badge rounded-pill" style={{ background: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                                    <i className="bi bi-check2-circle me-1"></i>{mcAnswered}/{mcTotal}
                                </span>
                            )}
                            {/* Countdown timer */}
                            {timeLeft !== null && (
                                <span
                                    className={`fw-bold px-3 py-1 rounded-pill ${timerUrgent ? 'timer-urgent' : ''}`}
                                    style={{ background: timerBg, color: timerColor, fontSize: '1rem', border: `1px solid ${timerColor}` }}
                                >
                                    <i className="bi bi-clock me-1"></i>{formatTime(timeLeft)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 rounded-pill overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.2)' }}>
                        <div className="h-100 rounded-pill" style={{ width: `${progress}%`, background: '#fff', transition: 'width 0.3s ease' }}></div>
                    </div>
                </div>

                {/* Question form */}
                <div className="p-4" style={{ background: '#fafcff' }}>
                    <ExamForm
                        // exam questions
                        questions={exam.questions}
                        // current student answers
                        answers={answers}
                        // MC answer handler
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
