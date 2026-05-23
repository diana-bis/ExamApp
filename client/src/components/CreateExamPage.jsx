import React from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

import useExamForm, { validateExamForm } from '../hooks/useExamForm';

const CreateExamPage = () => {
    // get exam id from URL
    const navigate = useNavigate();

    // Shared exam form hook
    const { form, setField, updateQuestion, removeQuestion, addQuestion, updateOption, removeOption, addOption } =
        useExamForm({ title: '', timeLimit: 30, passingGrade: 60, questions: [] });

    // ── Validation & save ──────────────────────────────────────────────────────

    // validate form and save new exam to backend, then navigate back to dashboard
    const handleCreate = async () => {
        if (!validateExamForm(form)) return;

        const newExam = await examService.createExam(form);
        notifyService.notifySuccess(`"${form.title}" created.`);
        loggerService.log('CreateExamPage › created exam:', newExam.id);
        navigate('/teacher');
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Create New Exam</h5>
                </div>
                <div className="card-body p-4">

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Exam title"
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
                            <button className="btn btn-outline-primary btn-sm" onClick={() => addQuestion('OPEN_ENDED')}>
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
                        <button className="btn btn-success" onClick={handleCreate}>Create Exam</button>
                        <button className="btn btn-outline-secondary" onClick={() => navigate('/teacher')}>Cancel</button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateExamPage;
