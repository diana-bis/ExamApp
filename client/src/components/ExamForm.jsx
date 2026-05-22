import React from 'react';

const ExamForm = ({ questions, answers, onSelectMC, onOpenEnded, onSubmit, onCancel, submitting }) => {
    return (
        <>
            {questions.map((q, index) => (
                <div key={q.id} className="mb-4 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <p className="fw-semibold mb-0">{index + 1}. {q.text}</p>
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
                                        onChange={() => onSelectMC(q.id, option)}
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
                            onChange={e => onOpenEnded(q.id, e.target.value)}
                        />
                    )}
                </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mt-2">
                <button className="btn btn-outline-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button className="btn btn-success" onClick={onSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
            </div>
        </>
    );
};

export default ExamForm;
