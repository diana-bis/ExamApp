import React from 'react';

const TEAL_GRADIENT = 'linear-gradient(135deg, #0288d1, #00bcd4)';

// Component for rendering exam questions and collecting answers from student
const ExamForm = ({ questions, answers, onSelectMC, onOpenEnded, onSubmit, onCancel, submitting }) => {
    return (
        <>
            <style>{`
              .option-row { cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease; }
              .option-row:hover { border-color: #0288d1 !important; background: #f0f7ff !important; }
            `}</style>

            {/* render all questions */}
            {questions.map((q, index) => (
                <div key={q.id} className="mb-4 p-4 rounded-4 bg-white shadow-sm"
                    style={{ border: '1px solid #e3f2fd' }}>
                    <div className="d-flex gap-3 align-items-start">

                        {/* Question number bubble */}
                        <div className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 34, height: 34, background: TEAL_GRADIENT, fontSize: '0.85rem' }}>
                            {index + 1}
                        </div>

                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <p className="fw-semibold mb-0">{q.text}</p>
                                <span className="badge ms-2"
                                    style={q.type === 'MULTIPLE_CHOICE'
                                        ? { background: TEAL_GRADIENT }
                                        : { background: '#607d8b' }}>
                                    {q.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Open Ended'}
                                </span>
                            </div>

                            {q.type === 'MULTIPLE_CHOICE' && (
                                <div className="d-flex flex-column gap-2">
                                    {q.options.map((option, optIndex) => {
                                        const selected = answers[q.id] === option;
                                        return (
                                            <div
                                                key={optIndex}
                                                className="option-row d-flex align-items-center gap-3 px-3 py-2 rounded-3"
                                                style={{
                                                    background: selected ? '#e3f2fd' : '#f8f9fa',
                                                    border: `2px solid ${selected ? '#0288d1' : '#dee2e6'}`,
                                                }}
                                                onClick={() => onSelectMC(q.id, option)}
                                            >
                                                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{
                                                        width: 22, height: 22,
                                                        background: selected ? '#0288d1' : '#dee2e6',
                                                        transition: 'background 0.15s ease',
                                                    }}>
                                                    {selected && <i className="bi bi-check text-white" style={{ fontSize: '0.75rem', lineHeight: 1 }}></i>}
                                                </div>
                                                <span style={{ color: selected ? '#0277bd' : '#333', fontWeight: selected ? 600 : 400 }}>
                                                    {option}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {q.type === 'OPEN_ENDED' && (
                                <textarea
                                    className="form-control shadow-sm"
                                    rows={4}
                                    placeholder="Write your answer here..."
                                    value={answers[q.id] ?? ''}
                                    onChange={e => onOpenEnded(q.id, e.target.value)}
                                    style={{ background: '#f8fbff', borderRadius: 8, border: '1px solid #cce5ff', resize: 'vertical' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
                <button className="btn btn-outline-secondary" onClick={onCancel}>
                    <i className="bi bi-arrow-left me-2"></i>Cancel
                </button>
                <button
                    className="btn text-white fw-semibold px-4"
                    style={{
                        background: submitting ? '#90a4ae' : 'linear-gradient(135deg, #2e7d32, #43a047)',
                        border: 'none',
                        borderRadius: 8,
                    }}
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    {submitting
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</>
                        : <><i className="bi bi-send-fill me-2"></i>Submit Exam</>}
                </button>
            </div>
        </>
    );
};

export default ExamForm;
