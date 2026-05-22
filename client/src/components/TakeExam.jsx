import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../api/ExamService';
import { submissionService } from '../api/SubmissionService';
import { loggerService } from '../services/LoggerService';
import { notifyService } from '../services/NotifyService';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

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

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    const unanswered = exam.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      notifyService.notifyError(`Please answer all questions. (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    loggerService.log(`TakeExam: submitting answers for exam "${examId}"`);

    try {
      await submissionService.submitExam({ examId, answers });

      const details = exam.questions.map(q => ({
        ...q,
        selected: answers[q.id],
        correct: answers[q.id] === q.answer,
      }));
      const score = details.filter(d => d.correct).length;

      loggerService.log(`TakeExam: submission complete — score ${score}/${exam.questions.length}`);
      notifyService.notifySuccess(`Submitted! You scored ${score} out of ${exam.questions.length}.`);
      setResult({ score, total: exam.questions.length, details });
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
    const percentage = Math.round((result.score / result.total) * 100);
    return (
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-success text-white">
            <h3>Results — {exam.title}</h3>
          </div>
          <div className="card-body">
            <h4 className="mb-1">Score: {result.score} / {result.total}</h4>
            <p className="text-muted mb-4">{percentage}% correct</p>
            <div className="list-group mb-4">
              {result.details.map((q, i) => (
                <div
                  key={q.id}
                  className={`list-group-item ${q.correct ? 'list-group-item-success' : 'list-group-item-danger'}`}
                >
                  <div className="d-flex justify-content-between">
                    <span><strong>Q{i + 1}:</strong> {q.question || q.text || q.questionText}</span>
                    <span>{q.correct ? '✓' : '✗'}</span>
                  </div>
                  <small>
                    Your answer: <strong>{q.selected}</strong>
                    {!q.correct && <> &nbsp;|&nbsp; Correct: <strong>{q.answer}</strong></>}
                  </small>
                </div>
              ))}
            </div>
            <button className="btn btn-outline-secondary" onClick={() => navigate('/student')}>
              Back to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">{exam.title}</h3>
          <span className="badge bg-light text-dark">
            {answeredCount} / {exam.questions.length} answered
          </span>
        </div>
        <div className="card-body">
          {exam.questions.map((q, index) => (
            <div key={q.id} className="mb-4 p-3 border rounded">
              <p className="fw-semibold mb-3">
                {index + 1}. {q.question || q.text || q.questionText}
              </p>
              <div className="d-flex flex-column gap-2">
                {(q.options || []).map((option, optIndex) => (
                  <div key={optIndex} className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`question-${q.id}`}
                      id={`q${q.id}-opt${optIndex}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => handleSelect(q.id, option)}
                    />
                    <label className="form-check-label" htmlFor={`q${q.id}-opt${optIndex}`}>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
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
