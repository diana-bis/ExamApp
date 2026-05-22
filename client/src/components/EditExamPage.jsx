import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

const EditExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        examService.getExamById(examId)
            .then(exam => setForm(JSON.parse(JSON.stringify(exam))))
            .catch(() => setForm(null))
            .finally(() => setLoading(false));
    }, [examId]);

    if (loading) {
        return <div className="container mt-4"><p className="text-muted">Loading...</p></div>;
    }

    if (!form) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger">Exam not found.</div>
            </div>
        );
    }

    // ── Field helpers ──────────────────────────────────────────────────────────

    const setField = (field, value) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const updateQuestion = (qi, changes) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], ...changes };
            return { ...prev, questions };
        });

    const removeQuestion = (qi) =>
        setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qi) }));

    const addQuestion = (type) => {
        const q = type === 'MULTIPLE_CHOICE'
            ? { id: `q${Date.now()}`, type, text: '', options: ['', ''], correctAnswer: '' }
            : { id: `q${Date.now()}`, type, text: '' };
        setForm(prev => ({ ...prev, questions: [...prev.questions, q] }));
    };

    const updateOption = (qi, oi, value) =>
        setForm(prev => {
            const questions = [...prev.questions];
            const options = [...questions[qi].options];
            options[oi] = value;
            questions[qi] = { ...questions[qi], options };
            return { ...prev, questions };
        });

    const removeOption = (qi, oi) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], options: questions[qi].options.filter((_, i) => i !== oi) };
            return { ...prev, questions };
        });

    const addOption = (qi) =>
        setForm(prev => {
            const questions = [...prev.questions];
            questions[qi] = { ...questions[qi], options: [...questions[qi].options, ''] };
            return { ...prev, questions };
        });

    // ── Save ───────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!form.title.trim()) {
            notifyService.notifyError('Title is required.');
            return;
        }
        if (!form.timeLimit || form.timeLimit <= 0) {
            notifyService.notifyError('Time limit must be greater than 0.');
            return;
        }
        if (form.passingGrade < 0 || form.passingGrade > 100) {
            notifyService.notifyError('Passing grade must be between 0 and 100.');
            return;
        }
        for (const q of form.questions) {
            if (!q.text.trim()) {
                notifyService.notifyError('All questions must have text.');
                return;
            }
            if (q.type === 'MULTIPLE_CHOICE' && q.options.some(o => !o.trim())) {
                notifyService.notifyError('All multiple choice options must be filled in.');
                return;
            }
            if (q.type === 'MULTIPLE_CHOICE' && !q.correctAnswer) {
                notifyService.notifyError('Select a correct answer for each multiple choice question.');
                return;
            }
        }

        await examService.updateExam(form.id, form);
        notifyService.notifySuccess(`"${form.title}" saved.`);
        loggerService.log('EditExamPage › updated exam:', form.id);
        navigate('/teacher');
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow">
                <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Edit Exam</h5>
                </div>
                <div className="card-body p-4">

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={form.title}
                            onChange={e => setField('title', e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="row mb-4">
                        <div className="col">
                            <label className="form-label fw-semibold">Time Limit (min)</label>
                            <input
                                type="number"
                                className="form-control"
                                min={1}
                                value={form.timeLimit}
                                onChange={e => setField('timeLimit', Number(e.target.value))}
                            />
                        </div>
                        <div className="col">
                            <label className="form-label fw-semibold">Passing Grade (%)</label>
                            <input
                                type="number"
                                className="form-control"
                                min={0}
                                max={100}
                                value={form.passingGrade}
                                onChange={e => setField('passingGrade', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-semibold mb-0">Questions ({form.questions.length})</h6>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => addQuestion('MULTIPLE_CHOICE')}>
                                + Multiple Choice
                            </button>
                            <button className="btn btn-outline-primary btn-sm btn-sm" onClick={() => addQuestion('OPEN_ENDED')}>
                                + Open Ended
                            </button>
                        </div>
                    </div>

                    {form.questions.length === 0 && (
                        <p className="text-muted small">No questions yet. Add one above.</p>
                    )}

                    {form.questions.map((q, qi) => (
                        <div key={q.id || qi} className="border rounded p-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className={`badge ${q.type === 'MULTIPLE_CHOICE' ? 'bg-primary' : 'bg-secondary'}`}>
                                    {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                                </span>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => removeQuestion(qi)}>
                                    Remove
                                </button>
                            </div>

                            <div className="mb-2">
                                <label className="form-label small fw-semibold">Question text</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Enter question"
                                    value={q.text}
                                    onChange={e => updateQuestion(qi, { text: e.target.value })}
                                />
                            </div>

                            {q.type === 'MULTIPLE_CHOICE' && (
                                <div>
                                    <label className="form-label small fw-semibold">
                                        Options — select the correct answer
                                    </label>
                                    {q.options.map((opt, oi) => (
                                        <div key={oi} className="d-flex align-items-center gap-2 mb-1">
                                            <input
                                                type="radio"
                                                name={`correct-${qi}`}
                                                checked={q.correctAnswer === opt && opt !== ''}
                                                onChange={() => updateQuestion(qi, { correctAnswer: opt })}
                                                title="Mark as correct answer"
                                            />
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={opt}
                                                placeholder={`Option ${oi + 1}`}
                                                onChange={e => {
                                                    const newVal = e.target.value;
                                                    if (q.correctAnswer === opt) updateQuestion(qi, { correctAnswer: newVal });
                                                    updateOption(qi, oi, newVal);
                                                }}
                                            />
                                            <button
                                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                                onClick={() => {
                                                    if (q.correctAnswer === opt) updateQuestion(qi, { correctAnswer: '' });
                                                    removeOption(qi, oi);
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <button className="btn btn-outline-secondary btn-sm mt-1" onClick={() => addOption(qi)}>
                                        + Add Option
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-success" onClick={handleSave}>Save Changes</button>
                        <button className="btn btn-outline-secondary" onClick={() => navigate('/teacher')}>Cancel</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditExamPage;
