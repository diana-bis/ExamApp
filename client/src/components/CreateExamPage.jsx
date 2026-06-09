import React from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { notifyService } from '../services/NotifyService';
import { loggerService } from '../services/LoggerService';

import useExamForm, { validateExamForm } from '../hooks/useExamForm';

const HEADER_GRADIENT = 'linear-gradient(135deg, #1a237e 0%, #4527a0 50%, #6a1b9a 100%)';
const PURPLE_ACTIVE   = 'linear-gradient(135deg, #4527a0, #6a1b9a)';

const CreateExamPage = () => {
    // get exam id from URL
    const navigate = useNavigate();

    // Shared exam form hook
    const { form, setField, updateQuestion, removeQuestion, addQuestion, updateOption, removeOption, addOption } =
        useExamForm({ title: '', timeLimit: 30, passingGrade: 60, questions: [], availableFrom: null, availableTo: null });

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
            <style>{`
              .q-card { transition: box-shadow 0.15s ease; }
              .q-card:hover { box-shadow: 0 4px 14px rgba(106,27,154,0.12) !important; }
            `}</style>

            <div className="card shadow-lg border-0 overflow-hidden">

                {/* Header */}
                <div className="py-3 px-4 text-white" style={{ background: HEADER_GRADIENT }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center"
                            style={{ width: 44, height: 44, flexShrink: 0 }}>
                            <i className="bi bi-journal-plus text-white" style={{ fontSize: '1.3rem' }}></i>
                        </div>
                        <h5 className="mb-0 fw-bold">Create New Exam</h5>
                    </div>
                </div>

                <div className="p-4" style={{ background: '#fdfaff' }}>

                    {/* Title */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ color: '#4527a0' }}>Title</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Exam title"
                            value={form.title}
                            onChange={e => setField('title', e.target.value)}
                            autoFocus
                            style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                        />
                    </div>

                    {/* Time + Passing Grade */}
                    <div className="row mb-4">
                        <div className="col">
                            <label className="form-label fw-semibold" style={{ color: '#4527a0' }}>Time Limit (min)</label>
                            <input
                                type="number"
                                className="form-control"
                                min={1}
                                value={form.timeLimit}
                                onChange={e => setField('timeLimit', Number(e.target.value))}
                                style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                            />
                        </div>
                        <div className="col">
                            <label className="form-label fw-semibold" style={{ color: '#4527a0' }}>Passing Grade (%)</label>
                            <input
                                type="number"
                                className="form-control"
                                min={0}
                                max={100}
                                value={form.passingGrade}
                                onChange={e => setField('passingGrade', Number(e.target.value))}
                                style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                            />
                        </div>
                    </div>

                    {/* Availability Window */}
                    <div className="mb-4 rounded-3 p-3" style={{ background: '#f3e5f5', border: '1px solid #d1c4e9' }}>
                        <h6 className="fw-semibold mb-3" style={{ color: '#4527a0' }}>
                            <i className="bi bi-calendar-range me-2"></i>Availability Window <span className="fw-normal text-muted">(optional)</span>
                        </h6>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold small" style={{ color: '#4527a0' }}>Opens at</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={form.availableFrom || ''}
                                    onChange={e => setField('availableFrom', e.target.value || null)}
                                    style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold small" style={{ color: '#4527a0' }}>Closes at</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    value={form.availableTo || ''}
                                    onChange={e => setField('availableTo', e.target.value || null)}
                                    style={{ background: '#f8f5ff', border: '1px solid #d1c4e9' }}
                                />
                            </div>
                        </div>
                        <p className="text-muted small mt-2 mb-0">Leave blank for no time restriction.</p>
                    </div>

                    {/* Questions header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0" style={{ color: '#4527a0' }}>
                            Questions ({form.questions.length})
                        </h6>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm text-white" style={{ background: PURPLE_ACTIVE, border: 'none', borderRadius: 7 }}
                                onClick={() => addQuestion('MULTIPLE_CHOICE')}>
                                <i className="bi bi-list-check me-1"></i>+ Multiple Choice
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 7 }}
                                onClick={() => addQuestion('OPEN_ENDED')}>
                                <i className="bi bi-pencil me-1"></i>+ Open Ended
                            </button>
                        </div>
                    </div>

                    {form.questions.length === 0 && (
                        <div className="text-center py-4 text-muted rounded-3" style={{ background: '#f3e5f5', border: '1px dashed #ce93d8' }}>
                            <i className="bi bi-journal-x" style={{ fontSize: '1.8rem', opacity: 0.4 }}></i>
                            <p className="small mt-2 mb-0">No questions yet. Add one above.</p>
                        </div>
                    )}

                    {/* Question cards */}
                    {form.questions.map((q, qi) => (
                        <div key={q.id || qi} className="q-card rounded-4 bg-white shadow-sm mb-3 overflow-hidden"
                            style={{ border: '1px solid #e8d5f5' }}>

                            {/* Card header */}
                            <div className="d-flex justify-content-between align-items-center px-4 py-2"
                                style={{ background: q.type === 'MULTIPLE_CHOICE' ? '#f3e5f5' : '#ede7f6' }}>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center"
                                        style={{ width: 26, height: 26, background: PURPLE_ACTIVE, fontSize: '0.78rem', flexShrink: 0 }}>
                                        {qi + 1}
                                    </div>
                                    <span className="badge" style={{ background: PURPLE_ACTIVE }}>
                                        {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                                    </span>
                                </div>
                                <button className="btn btn-link text-danger p-0" title="Remove question"
                                    onClick={() => removeQuestion(qi)}>
                                    <i className="bi bi-trash3"></i>
                                </button>
                            </div>

                            {/* Card body */}
                            <div className="px-4 py-3">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold" style={{ color: '#6a1b9a' }}>Question text</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Enter question"
                                        value={q.text}
                                        onChange={e => updateQuestion(qi, { text: e.target.value })}
                                        style={{ background: '#faf5ff', border: '1px solid #d1c4e9' }}
                                    />
                                </div>

                                {q.type === 'MULTIPLE_CHOICE' && (
                                    <div>
                                        <label className="form-label small fw-semibold" style={{ color: '#6a1b9a' }}>
                                            Options — select the correct answer
                                        </label>
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qi}`}
                                                    checked={q.correctAnswer === opt && opt !== ''}
                                                    onChange={() => updateQuestion(qi, { correctAnswer: opt })}
                                                    title="Mark as correct answer"
                                                    style={{ accentColor: '#6a1b9a' }}
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
                                                    style={{ background: '#faf5ff', border: '1px solid #d1c4e9' }}
                                                />
                                                <button
                                                    className="btn btn-link text-danger p-0"
                                                    onClick={() => {
                                                        if (q.correctAnswer === opt) updateQuestion(qi, { correctAnswer: '' });
                                                        removeOption(qi, oi);
                                                    }}
                                                >
                                                    <i className="bi bi-x-circle"></i>
                                                </button>
                                            </div>
                                        ))}
                                        <button className="btn btn-sm btn-outline-secondary mt-1" style={{ borderRadius: 6 }}
                                            onClick={() => addOption(qi)}>
                                            <i className="bi bi-plus me-1"></i>Add Option
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Save / Cancel */}
                    <div className="d-flex gap-2 mt-4">
                        <button className="btn text-white fw-semibold px-4"
                            style={{ background: PURPLE_ACTIVE, border: 'none', borderRadius: 8 }}
                            onClick={handleCreate}>
                            <i className="bi bi-check-lg me-2"></i>Create Exam
                        </button>
                        <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }}
                            onClick={() => navigate('/teacher')}>
                            Cancel
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateExamPage;
